//import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from "@aws-sdk/lib-dynamodb";

import { sliceGenerator } from "./slicer";
import { Table } from "./table";
import { MAX_WRITE_BATCH_SIZE } from "./util";

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

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  private params(item: TModel): PutCommandInput {
    return {
      TableName: this._table.getName(),
      Item: item,
      // TODO: ConditionExpression
    };
  }

  /* transaction(item: TModel): TransactWriteItem {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Put: this.params(item) as any,
    };
  } */

  /**
   * Inserts a single item into the table
   *
   * @param item Item to insert
   * @returns Put result
   */
  one(item: TModel): Promise<PutCommandOutput> {
    const command = new PutCommand(this.params(item));
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
