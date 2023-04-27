import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PutBuilder } from "put_builder";

import { Client } from "./client";
import { ScanBuilder } from "./scan_builder";

/**
 * Defined table
 */
export class Table<T extends Record<string, unknown>> {
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

  /**
   * Initializes a scan builder
   *
   * @returns ScanBuilder
   */
  scan(): ScanBuilder<T, T> {
    return new ScanBuilder(this);
  }

  put(): PutBuilder<T> {
    return new PutBuilder(this);
  }
}
