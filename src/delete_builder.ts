import { sliceGenerator } from "./slicer";
import Tunisia from "./index";

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

  one(key: string, value: string | number) {
    return this.$tunisia
      .getClient()
      .delete({
        TableName: this.tableName,
        Key: {
          [key]: value,
        },
      })
      .promise();
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
