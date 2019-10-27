import aws from "aws-sdk";
import { QueryBuilder } from "./query_builder";

export class Tunisia {
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

  public query(table: string) {
    return new QueryBuilder(table, this);
  }
}
