import { sliceGenerator } from "./slicer";
import Tunisia from "./index";

export class GetBuilder {
  private $tunisia: Tunisia;
  tableName: string;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  one<T = unknown>(key: string, value: string): Promise<T | null> {
    return this.$tunisia.query(this.tableName).eq(key, value).first();
  }

  async many<T = unknown>(
    key: string,
    values: (string | number)[],
  ): Promise<T[]> {
    const BATCH_SIZE = 100;
    const collected: T[] = [];

    for (const slice of sliceGenerator(values, BATCH_SIZE)) {
      const params = {
        RequestItems: {
          [this.tableName]: {
            Keys: slice.map((v: string | number) => ({
              [key]: v,
            })),
          },
        },
      };

      const result = await this.$tunisia.getClient().batchGet(params).promise();
      if (result.Responses) {
        const slice = result.Responses[this.tableName] as unknown as T[];
        collected.push(...slice);
      }
    }

    return collected;
  }
}
