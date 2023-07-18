//import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import {
  type BatchWriteCommandInput,
  type PutCommandInput,
  type PutCommandOutput,
  BatchWriteCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  _in,
  and,
  attributeExists,
  attributeNotExists,
  attributeType,
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
import { DotNestedKeys } from "./path";
import { sliceGenerator } from "./slicer";
import { Table } from "./table";
import { MAX_WRITE_BATCH_SIZE } from "./util";

const CONDITION_OPS = {
  $and: and,
  $or: or,
  $eq: eq,
  $neq: neq,
  $lt: lt,
  $lte: lte,
  $gt: gt,
  $gte: gte,
  $not: not,
  $beginsWith: beginsWith,
  $contains: contains,
  $between: between,
  $in: _in,
  $attributeExists: attributeExists,
  $attributeNotExists: attributeNotExists,
  $attributeType: attributeType,
};

/**
 * Creates a Put request item for batch put
 */
function composePutRequest<T extends Record<string, unknown>>(item: T) {
  return {
    PutRequest: {
      Item: item,
    },
  };
}

/**
 * Build batch put batch
 */
function buildBatch<TModel extends Record<string, unknown>>(
  items: TModel[],
): { PutRequest: { Item: TModel } }[] {
  return items.map(composePutRequest);
}

/**
 * Put/insert builder
 */
export class PutBuilder<TModel extends Record<string, unknown>> {
  private readonly _table: Table<TModel>;
  private _condExp?: IOperator;

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  private compile(item: TModel): PutCommandInput {
    const translator = new ExpressionTranslator();
    const ConditionExpression = this._condExp?.toString(translator);

    return {
      TableName: this._table.getName(),
      Item: item,
      ConditionExpression,
      ...translator.getMaps(),
    };
  }

  /* transaction(item: TModel): TransactWriteItem {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Put: this.compile(item) as any,
    };
  } */

  /**
   * Adds a put condition expression
   *
   * This only affects the single insert item (builder.one())
   */
  conditional(
    fn: (ops: {
      $and: typeof and;
      $or: typeof or;
      $not: typeof not;
      $eq: typeof eq<TModel, DotNestedKeys<TModel>>;
      $neq: typeof neq<TModel, DotNestedKeys<TModel>>;
      $lt: typeof lt<TModel, DotNestedKeys<TModel>>;
      $lte: typeof lte<TModel, DotNestedKeys<TModel>>;
      $gt: typeof gt<TModel, DotNestedKeys<TModel>>;
      $gte: typeof gte<TModel, DotNestedKeys<TModel>>;
      $beginsWith: typeof beginsWith<TModel, DotNestedKeys<TModel>>;
      $contains: typeof contains<TModel, DotNestedKeys<TModel>>;
      $between: typeof between<TModel, DotNestedKeys<TModel>>;
      $in: typeof _in<TModel, DotNestedKeys<TModel>>;
      $attributeExists: typeof attributeExists<TModel, DotNestedKeys<TModel>>;
      $attributeNotExists: typeof attributeNotExists<TModel, DotNestedKeys<TModel>>;
      $attributeType: typeof attributeType<TModel, DotNestedKeys<TModel>>;
    }) => IOperator,
  ) {
    this._condExp = fn(CONDITION_OPS);
    return this;
  }

  /**
   * Inserts a single item into the table
   *
   * @param item Item to insert
   * @returns Put result
   */
  one(item: TModel): Promise<PutCommandOutput> {
    const command = new PutCommand(this.compile(item));
    return this._table.getClient().send(command);
  }

  /**
   * Inserts many items into the table
   *
   * @param items Items to add
   */
  async many<K extends keyof TModel>(items: Record<K, string | number>[]): Promise<void> {
    for (const slice of sliceGenerator(items, MAX_WRITE_BATCH_SIZE)) {
      let array = buildBatch(slice);

      for (let i = 10; i >= 0; --i) {
        if (i === 0) {
          throw new Error("Too many retries for put.many batch");
        }

        const params = {
          RequestItems: {
            [this._table.getName()]: array,
          },
        };
        const command = new BatchWriteCommand(params);
        const result = await this._table.getClient().send(command);
        const unprocessed = result.UnprocessedItems?.[this._table.getName()] ?? [];

        if (!unprocessed.length) {
          break;
        }

        array = unprocessed as typeof array;

        // TODO: exponential backoff
      }
    }
  }
}
