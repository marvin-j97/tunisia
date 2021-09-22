import { DynamoDB } from "aws-sdk";
import { QueryBuilder } from "./query_builder";

import Tunisia from "./index";
import { sliceGenerator } from "./slicer";

/**
 * Creates a Delete request item for batch delete
 */
function composeDeleteRequest<T>(key: string, value: T) {
  return {
    DeleteRequest: {
      Key: {
        [key]: value,
      },
    },
  };
}

export class DeleteBuilder {
  private $tunisia: Tunisia;
  private tableName: string;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  params(key: string, value: string | number) {
    return {
      TableName: this.tableName,
      Key: {
        [key]: value,
      },
    };
  }

  transaction(key: string, value: string | number): DynamoDB.DocumentClient.TransactWriteItem {
    return {
      Delete: this.params(key, value),
    };
  }

  one(key: string, value: string | number) {
    return this.$tunisia.getClient().delete(this.params(key, value)).promise();
  }

  buildBatch(key: string, values: (string | number)[]) {
    return values.map((value) => composeDeleteRequest(key, value));
  }

  async many(key: string, values: string[] | number[]) {
    const BATCH_SIZE = 25;

    for (const slice of sliceGenerator<string | number>(values, BATCH_SIZE)) {
      const params = {
        RequestItems: {
          [this.tableName]: this.buildBatch(key, slice),
        },
      };

      await this.$tunisia.getClient().batchWrite(params).promise();
    }
  }

  /**
   * Uses a Query builder to iterate through an index, deleting every item it encounters
   * Optionally calls a callback containing the deleted items per page
   */
  async byQuery<T extends Record<string, any>>(
    query: QueryBuilder,
    key: string,
    onPage?: (items: T[]) => Promise<unknown>,
  ): Promise<number> {
    let num = 0;
    const tableName = query.params().TableName;

    for await (const { items } of query.iterate<T>()) {
      num += items.length;
      if (items.length) {
        await this.$tunisia.delete(tableName).many(
          key,
          items.map((item) => item[key]),
        );
        onPage && (await onPage(items));
      }
    }

    return num;
  }
}
