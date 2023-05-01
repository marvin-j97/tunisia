import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from "@aws-sdk/lib-dynamodb";

import { Table } from "./table";

/**
 * Creates a Delete request item for batch delete
 */
/* function composeDeleteRequest<T>(key: string, value: T) {
  return {
    DeleteRequest: {
      Key: {
        [key]: value,
      },
    },
  };
} */

/**
 *
 */
function buildKey(
  partKey: [string, string | number],
  sortKey?: [string, string | number],
): Record<string, unknown> {
  const key: Record<string, unknown> = {};
  key[partKey[0]] = partKey[1];
  if (sortKey) {
    key[sortKey[0]] = sortKey[1];
  }
  return key;
}

/**
 * Delete builder
 */
export class DeleteBuilder<TModel extends Record<string, unknown>> {
  private readonly _table: Table<TModel>;

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  private params<K extends keyof TModel>(
    partKey: [K, string | number],
    sortKey?: [K, string | number],
  ): DeleteCommandInput {
    return {
      TableName: this._table.getName(),
      Key: buildKey(
        partKey as [string, string | number],
        sortKey as [string, string | number] | undefined,
      ),
      // TODO: ConditionExpression
    };
  }

  /* transaction(key: string, value: string | number): DynamoDB.DocumentClient.TransactWriteItem {
    return {
      Delete: this.params(key, value),
    };
  } */

  /*  private buildBatch(key: string, values: (string | number)[]) {
    return values.map((value) => composeDeleteRequest(key, value));
  } */

  /**
   * Deletes a single item from the table
   *
   * @param item Item to delete
   * @returns Delete result
   */
  one<K extends keyof TModel>(
    partKey: [K, string | number],
    sortKey?: [K, string | number],
  ): Promise<DeleteCommandOutput> {
    return this._table.getClient().send(new DeleteCommand(this.params(partKey, sortKey)));
  }

  // TODO: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
  /* async many(key: string, values: string[] | number[]) {
    const BATCH_SIZE = 25;

    for (const slice of sliceGenerator<string | number>(values, BATCH_SIZE)) {
      const params = {
        RequestItems: {
          [this.tableName]: this.buildBatch(key, slice),
        },
  by
      };

      await this.$tunisia.getClient().batchWrite(params).promise();
    }
  } */
}

// TODO: and byScan
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
