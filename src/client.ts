import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { Table } from "./table";

/**
 * DDB Client wrapper
 */
export class Client {
  readonly _ddbClient: DynamoDBDocumentClient;

  constructor(opts?: DynamoDBClientConfig) {
    const client = new DynamoDBClient(opts ?? {});
    this._ddbClient = DynamoDBDocument.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
      },
    });
  }

  /**
   * Defines a DynamoDB table. This does not create the table automatically!
   *
   * @param name
   * @returns
   */
  defineTable<T extends Record<string, unknown>>(name: string): Table<T> {
    return new Table(this, name);
  }
}
