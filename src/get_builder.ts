import Tunisia from "./index";

export class BatchGetBuilder {
  private $tunisia: Tunisia;
  tableName: string;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  async many<T = unknown>(
    key: string,
    values: (string | number)[],
  ): Promise<T[]> {
    const BATCH_SIZE = 100;
    let index = 0;

    let slice = values.slice(index, index + BATCH_SIZE);

    const items = [] as T[];

    do {
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
        const slice = (result.Responses[this.tableName] as unknown) as T[];
        items.push(...slice);
      }

      index += BATCH_SIZE;
      slice = values.slice(index, index + BATCH_SIZE);
    } while (slice.length);

    return items;
  }
}
