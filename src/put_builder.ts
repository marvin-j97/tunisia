import Tunisia from "./index";
import { AnyMap } from "./util";

export class PutBuilder {
  private $tunisia: Tunisia;
  private tableName: string;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  one(item: AnyMap) {
    return this.$tunisia
      .getClient()
      .put({
        TableName: this.tableName,
        Item: item
      })
      .promise();
  }

  async many(items: AnyMap[]) {
    try {
      const BATCH_SIZE = 25;
      let index = 0;

      let sliced = items.slice(index, index + BATCH_SIZE);

      do {
        const batch = sliced.map(item => {
          return {
            PutRequest: {
              Item: item
            }
          };
        });

        const params = {
          RequestItems: {
            [this.tableName]: batch
          }
        };

        await this.$tunisia
          .getClient()
          .batchWrite(params)
          .promise();

        index += BATCH_SIZE;
        sliced = items.slice(index, index + BATCH_SIZE);
      } while (sliced.length);
    } catch (err) {
      throw err;
    }
  }
}
