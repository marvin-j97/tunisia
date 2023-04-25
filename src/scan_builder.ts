import { ScanCommand, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb";

import {
  _in,
  and,
  beginsWith,
  between,
  contains,
  eq,
  ExpressionTranslator,
  gt,
  gte,
  IOperator,
  lt,
  lte,
  neq,
  not,
  or,
} from "./operator";
import { Table } from "./table";

type StartKey = Record<string, unknown>;

// TODO: attribute_exists, attribute_not_exists, attribute_type, size
const SCAN_FILTER_OPTS = {
  and,
  or,
  eq,
  neq,
  lt,
  lte,
  gt,
  gte,
  not,
  beginsWith,
  contains,
  between,
  _in,
};

/**
 * Scan builder
 */
export class ScanBuilder<T extends Record<string, unknown>> {
  private readonly _table: Table<T>;
  private _filter?: IOperator;
  private _limitItems?: number;
  private _startKey?: StartKey;
  // TODO: private _pickKeys?: (keyof T)[];

  constructor(table: Table<T>) {
    this._table = table;
  }

  limit(limit: number): this {
    this._limitItems = limit;
    return this;
  }

  startAt(startKey?: StartKey): this {
    this._startKey = startKey;
    return this;
  }

  /*   pick<K extends keyof T>(keys: K[]): ScanBuilder<Pick<T, K>> {
    this._pickKeys = keys;
    return this as unknown as ScanBuilder<Pick<T, K>>;
  } */

  where(
    fn: (ops: {
      and: typeof and;
      or: typeof or;
      not: typeof not;
      eq: typeof eq<T, keyof T>;
      neq: typeof neq<T, keyof T>;
      lt: typeof lt<T, keyof T>;
      lte: typeof lte<T, keyof T>;
      gt: typeof gt<T, keyof T>;
      gte: typeof gte<T, keyof T>;
      beginsWith: typeof beginsWith<T>;
      contains: typeof contains<T>;
      between: typeof between<T>;
      _in: typeof _in<T, keyof T>;
    }) => IOperator,
  ): this {
    this._filter = fn(SCAN_FILTER_OPTS);
    return this;
  }

  compile(): ScanCommandInput {
    const translator = new ExpressionTranslator();
    const filterString = this._filter?.toString(translator);

    const scanInput: ScanCommandInput = {
      TableName: this._table.getName(),
      ExpressionAttributeNames: this._filter && translator.expressionAttributeNames,
      ExpressionAttributeValues: this._filter && translator.expressionAttributeValues,
      FilterExpression: filterString,
      Limit: this._limitItems,
      ExclusiveStartKey: this._startKey,
      // TODO: with translator: ProjectionExpression: this._pickKeys?.length ? this._pickKeys.join(", ") : undefined,
    };
    return scanInput;
  }

  raw(): Promise<ScanCommandOutput> {
    return this._table.getClient().send(new ScanCommand(this.compile()));
  }

  async items(): Promise<T[]> {
    const result = await this.raw();
    return (result.Items || []) as T[];
  }

  async first(): Promise<T | null> {
    const [first] = await this.items();
    return first ?? null;
  }

  async all(): Promise<T[]> {
    const collected: T[] = [];

    for await (const { items } of this.iter()) {
      for (const item of items) {
        collected.push(item);
      }
    }

    return collected;
  }

  async count(): Promise<number> {
    let count = 0;

    for await (const { items } of this.iter()) {
      count += items.length;
    }

    return count;
  }

  async *iter(): AsyncGenerator<{
    items: T[];
    key: StartKey | undefined;
  }> {
    const params = this.compile();

    while (true) {
      const scanResult = await this._table.getClient().send(new ScanCommand(params));

      if (scanResult.Items?.length) {
        if (scanResult.LastEvaluatedKey) {
          params.ExclusiveStartKey = scanResult.LastEvaluatedKey;
        }
        yield { items: scanResult.Items, key: scanResult.LastEvaluatedKey } as {
          items: T[];
          key: StartKey;
        };
        if (!scanResult.LastEvaluatedKey) {
          break;
        }
      } else {
        break;
      }
    }
  }
}
