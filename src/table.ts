import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { Client } from "./client";
import { ScanBuilder } from "./scan_builder";

/**
 * Defined table
 */
export class Table<T extends Record<string, string | number | boolean>> {
  private _client: Client;
  private _name: string;

  constructor(client: Client, name: string) {
    this._client = client;
    this._name = name;
  }

  protected getRoot(): Client {
    return this._client;
  }

  getClient(): DynamoDBDocumentClient {
    return this.getRoot()._ddbClient;
  }

  getName(): string {
    return this._name;
  }

  scan(): ScanBuilder<T> {
    return new ScanBuilder(this);
  }
}
