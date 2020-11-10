import Tunisia from "./index";

export class PutBuilder<T extends Record<string, unknown>> {
  private $tunisia: Tunisia;
  private tableName: string;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  one(item: T) {
    return this.$tunisia
      .getClient()
      .put({
        TableName: this.tableName,
        Item: item,
      })
      .promise();
  }

  async many(items: T[]) {
    const BATCH_SIZE = 25;
    let index = 0;

    let sliced = items.slice(index, index + BATCH_SIZE);

    do {
      const batch = sliced.map((item) => {
        return {
          PutRequest: {
            Item: item,
          },
        };
      });

      const params = {
        RequestItems: {
          [this.tableName]: batch,
        },
      };

      const result = await this.$tunisia
        .getClient()
        .batchWrite(params)
        .promise();

      index += BATCH_SIZE;
      sliced = items.slice(index, index + BATCH_SIZE);
    } while (sliced.length);
  }
}
