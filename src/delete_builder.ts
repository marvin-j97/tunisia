import { DynamoDB } from "aws-sdk";
import Tunisia from "./index";
import { sliceGenerator } from "./slicer";

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
}
