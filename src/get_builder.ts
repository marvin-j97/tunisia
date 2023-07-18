import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";

import { sliceGenerator } from "./slicer";
import { Table } from "./table";
import { MAX_GET_BATCH_SIZE } from "./util";

/**
 * Get builder
 */
export class GetBuilder<TModel extends Record<string, unknown>> {
  private readonly _table: Table<TModel>;

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  // TODO:
  /**
   * Gets a single item from the table
   *
   * @param item Key of item to fetch
   * @returns Item or null
   */
  //one<K extends keyof TModel>(key: Record<K, string | number>): Promise<TModel | null> {
  /* const command = new DeleteCommand(this.params(key));
    return this._table.getClient().send(command); */
  //}

  /**
   * Gets many items from the table
   *
   * @param key Partition key
   * @param values Keys to delete
   */
  async many<K extends keyof TModel>(keys: Record<K, string | number>[]): Promise<TModel[]> {
    const collected: TModel[] = [];

    for (const slice of sliceGenerator(keys, MAX_GET_BATCH_SIZE)) {
      let array = slice;

      for (let i = 10; i >= 0; --i) {
        if (i === 0) {
          throw new Error("Too many retries for get.many batch");
        }

        const params = {
          RequestItems: {
            [this._table.getName()]: {
              Keys: array,
            },
          },
        };
        const command = new BatchGetCommand(params);
        const result = await this._table.getClient().send(command);
        const unprocessed = result.UnprocessedKeys?.[this._table.getName()]?.Keys ?? [];
        collected.push(...((result.Responses?.[this._table.getName()] ?? []) as TModel[]));

        if (!unprocessed.length) {
          break;
        }

        array = unprocessed as typeof array;

        // TODO: exponential backoff
      }
    }

    return collected;
  }
}
