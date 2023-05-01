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
} from "./expression";
import { DeepPick, DotNestedKeys } from "./path";
import { Table } from "./table";

type StartKey = Record<string, unknown>;

type TypedScanCommandOutput<T> = Omit<ScanCommandOutput, "Items"> & { Items?: T[] };

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
export class ScanBuilder<
  TModel extends Record<string, unknown>,
  TOutput extends Record<string, unknown>,
> {
  private readonly _table: Table<TModel>;
  private _indexName?: string;
  private _filter?: IOperator;
  private _limitItems?: number;
  private _startKey?: StartKey;
  private _pickKeys?: DotNestedKeys<TModel>[];

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  /**
   * Sets an index to scan (insteada of the entire table)
   *
   * @param name Index name
   * @returns ScanBuilder
   */
  index(name: string): this {
    this._indexName = name;
    return this;
  }

  /**
   * Sets the page limit
   *
   * @param limit Limit of items to return
   * @returns ScanBuilder
   */
  limit(limit: number): this {
    this._limitItems = limit;
    return this;
  }

  /**
   * Sets the start key of the scan
   *
   * @param startKey Start key to use
   * @returns ScanBuilder
   */
  startAt(startKey?: StartKey): this {
    this._startKey = startKey;
    return this;
  }

  /**
   * Registers a projection (only returns given keys)
   *
   * @param keys Keys to pick select
   * @returns ScanBuilder
   */
  select<K extends DotNestedKeys<TModel>>(keys: K[]): ScanBuilder<TModel, DeepPick<TModel, K>> {
    this._pickKeys = keys;
    return this as unknown as ScanBuilder<TModel, DeepPick<TModel, K>>;
  }

  /**
   * Registers a scan filter
   *
   * @param fn Filter function
   * @returns ScanBuilder
   */
  where(
    fn: (ops: {
      and: typeof and;
      or: typeof or;
      not: typeof not;
      eq: typeof eq<TModel, DotNestedKeys<TModel>>;
      neq: typeof neq<TModel, DotNestedKeys<TModel>>;
      lt: typeof lt<TModel, DotNestedKeys<TModel>>;
      lte: typeof lte<TModel, DotNestedKeys<TModel>>;
      gt: typeof gt<TModel, DotNestedKeys<TModel>>;
      gte: typeof gte<TModel, DotNestedKeys<TModel>>;
      beginsWith: typeof beginsWith<TModel, DotNestedKeys<TModel>>;
      contains: typeof contains<TModel, DotNestedKeys<TModel>>;
      between: typeof between<TModel, DotNestedKeys<TModel>>;
      _in: typeof _in<TModel, DotNestedKeys<TModel>>;
    }) => IOperator,
  ): this {
    this._filter = fn(SCAN_FILTER_OPTS);
    return this;
  }

  /**
   * Compiles the scan builder to a native DynamoDB scan input
   *
   * @returns DynamoDB scan input
   */
  compile(): ScanCommandInput {
    const translator = new ExpressionTranslator();
    const filterString = this._filter?.toString(translator);

    const pickKeys = this._pickKeys?.length
      ? this._pickKeys.map((x) => translator.getName(x)).join(", ")
      : undefined;

    const scanInput: ScanCommandInput = {
      TableName: this._table.getName(),
      ExpressionAttributeNames: Object.keys(translator.expressionAttributeNames).length
        ? translator.expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: Object.keys(translator.expressionAttributeValues).length
        ? translator.expressionAttributeValues
        : undefined,
      FilterExpression: filterString,
      Limit: this._limitItems,
      ExclusiveStartKey: this._startKey,
      ProjectionExpression: pickKeys,
      IndexName: this._indexName,
      // TODO: ConsistentRead
    };
    return scanInput;
  }

  /**
   * Executes the built query and returns the native return data defined by the AWS sdk
   *
   * @returns Scan result
   */
  async raw(): Promise<TypedScanCommandOutput<TOutput>> {
    const result = await this._table.getClient().send(new ScanCommand(this.compile()));
    return result as TypedScanCommandOutput<TOutput>;
  }

  /**
   * Executes the built query and returns the found items
   *
   * @returns Found items
   */
  async items(): Promise<TOutput[]> {
    const result = await this.raw();
    return result.Items || [];
  }

  /**
   * Executes the built query and returns the first found item (or null)
   *
   * @returns First found item or null
   */
  async first(): Promise<TOutput | null> {
    const [first] = await this.items();
    return first ?? null;
  }

  /**
   * Scans through the entire table, collecting all items
   *
   * **NOTE**: This could be become *very* expensive and slow, be sure you know what you're doing.
   * If your table is big, your program might OOM
   *
   * @returns All items of the table
   */
  async all(): Promise<TOutput[]> {
    const collected: TOutput[] = [];

    for await (const { items } of this.iter()) {
      for (const item of items) {
        collected.push(item);
      }
    }

    return collected;
  }

  /**
   * Scans through the entire table, counting all items
   *
   * **NOTE**: This could be become *very* expensive and slow, be sure you know what you're doing.
   *
   * @returns Table size
   */
  async count(): Promise<number> {
    let count = 0;

    for await (const { items } of this.iter()) {
      count += items.length;
    }

    return count;
  }

  /**
   * Creates an iterator over the table
   *
   * @returns Table async iterator
   */
  async *iter(): AsyncGenerator<{
    items: TOutput[];
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
          items: TOutput[];
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
