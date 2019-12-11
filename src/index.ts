import aws from "aws-sdk";
import { QueryBuilder } from "./query_builder";
import { ScanBuilder } from "./scan_builder";
import { UpdateBuilder } from "./update_builder";
import { DeleteBuilder } from "./delete_builder";
import { PutBuilder } from "./put_builder";

export const STOP = Symbol();

export default class Tunisia {
  private client: aws.DynamoDB.DocumentClient;

  public getClient() {
    return this.client;
  }

  public static fromConfig(
    config: aws.DynamoDB.DocumentClient.DocumentClientOptions
  ) {
    return new Tunisia(config);
  }

  public static fromClient(client: aws.DynamoDB.DocumentClient) {
    return new Tunisia(client);
  }

  constructor(
    config:
      | aws.DynamoDB.DocumentClient.DocumentClientOptions
      | aws.DynamoDB.DocumentClient
  ) {
    if (config instanceof aws.DynamoDB.DocumentClient) {
      this.client = config;
    } else {
      this.client = new aws.DynamoDB.DocumentClient(config);
    }
  }

  public insert(table: string) {
    return new PutBuilder(table, this);
  }
  public create(table: string) {
    return this.insert(table);
  }
  public put(table: string) {
    return this.insert(table);
  }

  public delete(table: string) {
    return new DeleteBuilder(table, this);
  }
  public remove(table: string) {
    return this.delete(table);
  }

  public query(table: string) {
    return new QueryBuilder(table, this);
  }

  public scan(table: string) {
    return new ScanBuilder(table, this);
  }

  public update(table: string) {
    return new UpdateBuilder(table, this);
  }
  public change(table: string) {
    return this.update(table);
  }
}
