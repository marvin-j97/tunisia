import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { Client } from "./client";
import { DeleteBuilder } from "./delete_builder";
import { PutBuilder } from "./put_builder";
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
   * @example
   * const count = await myTable
   *    .scan()
   *    .where(({ eq }) => eq("name", "John Doe"))
   *    .count();
   * @example
   * const scanner = myTable
   *    .scan()
   *    .where(({ and, between, eq }) => and(
   *       eq("name", "John Doe"),
   *       between("age", 40, 50)
   *     ))
   *    .iter();
   *
   * for await (const page of scanner) {
   *   console.log(page);
   * }
   *
   * @returns ScanBuilder
   */
  scan(): ScanBuilder<T, T> {
    return new ScanBuilder(this);
  }

  /**
   * Initializes a put builder
   *
   * @example
   * const result = await myTable
   *    .put()
   *    .one({ id: 0, name: "Peter" });
   *
   * @returns Put builder
   */
  put(): PutBuilder<T> {
    return new PutBuilder(this);
  }

  /**
   * Initializes a delete builder
   *
   * @example
   * const result = await myTable
   *    .delete()
   *    .one(["id", "Peter"]);
   *
   * @example
   * // Compound key
   * const result = await myTable
   *    .delete()
   *    .one(["id", "Peter"], ["item", "invoice:12345"]);
   *
   * @returns Put builder
   */
  delete(): DeleteBuilder<T> {
    return new DeleteBuilder(this);
  }

  /**
   * Uses DescribeTable to get an approximate count of the table's item count
   *
   * **NOTE**: DynamoDB updates this value approximately every six hours
   */
  async countApproximate(): Promise<number> {
    const command = new DescribeTableCommand({
      TableName: this._name,
    });
    const result = await this.getClient().send(command);
    return result.Table?.ItemCount ?? 0;
  }
}
