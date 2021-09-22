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

  one<T = unknown>(item: T) {
    return this.$tunisia
      .getClient()
      .put({
        TableName: this.tableName,
        Item: item,
      })
      .promise();
  }

  buildBatch<T>(items: T[]) {
    return items.map(composePutRequest);
  }

  async many<T = unknown>(items: T[]) {
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
