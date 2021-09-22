import { DynamoDB } from "aws-sdk";

import Tunisia from "./index";
import { sliceGenerator } from "./slicer";

function composePutRequest<T>(item: T) {
  return {
    PutRequest: {
      Item: item,
    },
  };
}

export class PutBuilder {
  private $tunisia: Tunisia;
  private tableName: string;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  params<T extends Record<string, any>>(item: T) {
    return {
      TableName: this.tableName,
      Item: item,
    };
  }

  transaction<T extends Record<string, any>>(item: T): DynamoDB.DocumentClient.TransactWriteItem {
    return {
      Put: this.params(item),
    };
  }

  one<T extends Record<string, any>>(item: T) {
    return this.$tunisia.getClient().put(this.params(item)).promise();
  }

  buildBatch<T extends Record<string, any>>(items: T[]) {
    return items.map(composePutRequest);
  }

  async many<T extends Record<string, any>>(items: T[]) {
    const BATCH_SIZE = 25;

    for (const slice of sliceGenerator(items, BATCH_SIZE)) {
      const params = {
        RequestItems: {
          [this.tableName]: this.buildBatch(slice),
        },
      };

      await this.$tunisia.getClient().batchWrite(params).promise();
    }
  }
}
