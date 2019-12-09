import { Tunisia } from "./index";
import { inspect } from "util";

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
          [key]: value
        }
      })
      .promise();
  }

  buildBatch(key: string, values: (string | number)[]) {
    return values.map(value => {
      return {
        DeleteRequest: {
          Key: {
            [key]: value
          }
        }
      };
    });
  }

  async many(key: string, values: string[] | number[]) {
    try {
      const BATCH_SIZE = 25;
      let index = 0;

      let slice = values.slice(index, index + BATCH_SIZE);

      do {
        const params = {
          RequestItems: {
            [this.tableName]: this.buildBatch(key, slice)
          }
        };

        await this.$tunisia
          .getClient()
          .batchWrite(params)
          .promise();

        index += BATCH_SIZE;
        slice = values.slice(index, index + BATCH_SIZE);
      } while (slice.length);
    } catch (err) {
      throw err;
    }
  }
}
