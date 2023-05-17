import {
  BatchWriteCommand,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
} from "@aws-sdk/lib-dynamodb";

import { ScanBuilder } from "./scan_builder";
import { sliceGenerator } from "./slicer";
import { Table } from "./table";
import { MAX_BATCH_SIZE } from "./util";

/**
 * Creates a Delete request item for batch delete
 */
function composeDeleteRequest(key: Record<string, unknown>) {
  return {
    DeleteRequest: {
      Key: key,
    },
  };
}

/**
 * Build batch write batch
 */
function buildBatch<TModel extends Record<string, unknown>, K extends keyof TModel>(
  keys: Record<K, string | number>[],
) {
  return keys.map(composeDeleteRequest);
}

/**
 * Pick function
 */
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret: Record<string, any> = {};
  keys.forEach((key) => {
    ret[key as string] = obj[key];
  });
  return ret as Pick<T, K>;
}

/**
 * Delete builder
 */
export class DeleteBuilder<TModel extends Record<string, unknown>> {
  private readonly _table: Table<TModel>;

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  private params<K extends keyof TModel>(key: Record<K, string | number>): DeleteCommandInput {
    return {
      TableName: this._table.getName(),
      Key: key,
      // TODO: ConditionExpression
    };
  }

  /* transaction(key: string, value: string | number): DynamoDB.DocumentClient.TransactWriteItem {
    return {
      Delete: this.params(key, value),
    };
  } */

  /**
   * Deletes a single item from the table
   *
   * @param item Item to delete
   * @returns Delete result
   */
  one<K extends keyof TModel>(key: Record<K, string | number>): Promise<DeleteCommandOutput> {
    const command = new DeleteCommand(this.params(key));
    return this._table.getClient().send(command);
  }

  /**
   * Deletes many items from the table
   *
   * @param key Partition key
   * @param values Keys to delete
   */
  async many<K extends keyof TModel>(keys: Record<K, string | number>[]): Promise<void> {
    for (const slice of sliceGenerator(keys, MAX_BATCH_SIZE)) {
      let array = buildBatch(slice);

      for (let i = 10; i >= 0; --i) {
        if (i === 0) {
          throw new Error("Too many retries for delete batch");
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
      }
    }
  }

  /**
   * Uses a Scan builder to iterate through a table (or index), deleting every item it encounters
   * Optionally calls a callback containing the deleted items per page
   */
  async byScan<K extends keyof TModel, Ks extends K[]>(
    scanner: ScanBuilder<TModel, TModel>,
    keys: Ks,
    onPage?: (items: TModel[]) => Promise<unknown>,
  ): Promise<number> {
    let count = 0;

    for await (const { items } of scanner.iter()) {
      count += items.length;

      if (items.length) {
        await this.many(items.map((item) => pick(item, keys)) as Record<K, string | number>[]);
        onPage && (await onPage(items));
      }
    }

    return count;
  }
}

/**
 * Uses a Query builder to iterate through an index, deleting every item it encounters
 * Optionally calls a callback containing the deleted items per page
 */
/* async byQuery<T extends Record<string, any>>(
    query: QueryBuilder,
    key: string,
    onPage?: (items: T[]) => Promise<unknown>,
  ): Promise<number> {
    let num = 0;

    for await (const { items } of query.iterate<T>()) {
      num += items.length;
      if (items.length) {
        await this.$tunisia.delete(this.tableName).many(
          key,
          items.map((item) => item[key]),
        );
        onPage && (await onPage(items));
      }
    }

    return num;
  }
}*/
