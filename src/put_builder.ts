//import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { PutCommand, PutCommandInput, PutCommandOutput } from "@aws-sdk/lib-dynamodb";

import { Table } from "./table";

/**
 * Creates a Put request item for batch put
 */
/* function composePutRequest<T>(item: T) {
  return {
    PutRequest: {
      Item: item,
    },
  };
} */

/* private buildBatch(items: TModel[]): { PutRequest: { Item: TModel } }[] {
    return items.map(composePutRequest);
  } */

// const BATCH_SIZE = 25;

/**
 * Put/insert builder
 */
export class PutBuilder<TModel extends Record<string, unknown>> {
  private readonly _table: Table<TModel>;

  constructor(table: Table<TModel>) {
    this._table = table;
  }

  private params(item: TModel): PutCommandInput {
    return {
      TableName: this._table.getName(),
      Item: item,
      // TODO: ConditionExpression
    };
  }

  /**
   * Inserts a single item into the table
   *
   * @param item Item to insert
   * @returns Put result
   */
  one(item: TModel): Promise<PutCommandOutput> {
    const command = new PutCommand(this.params(item));
    return this._table.getClient().send(command);
  }

  /* transaction(item: TModel): TransactWriteItem {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Put: this.params(item) as any,
    };
  } */

  // TODO: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
  /*  async many(items: TModel[], threads: number): Promise<void> {
    const tableName = this._table.getName();
    const client = this._table.getClient();

     for (const slice of sliceGenerator(items, BATCH_SIZE)) {
      const params = {
        RequestItems: {
          [tableName]: this.buildBatch(slice),
        },
      };

      //let result = await client.send(new BatchWriteCommand(params));

      //await this.$tunisia.getClient().batchWrite(params).promise();

      // TODO: use threads...maybe
      // TODO: check UnprocessedItems
    }
  } */
}
