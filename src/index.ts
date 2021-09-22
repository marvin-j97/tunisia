import aws from "aws-sdk";

import { DeleteBuilder } from "./delete_builder";
import { GetBuilder } from "./get_builder";
import { PutBuilder } from "./put_builder";
import { QueryBuilder } from "./query_builder";
import { ScanBuilder } from "./scan_builder";
import { TransactionWriteBuilder } from "./transaction_write_builder";
import { UpdateBuilder } from "./update_builder";

type Config = aws.DynamoDB.DocumentClient.DocumentClientOptions &
  aws.DynamoDB.Types.ClientConfiguration;

export default class Tunisia {
  private client: aws.DynamoDB.DocumentClient;

  public getClient() {
    return this.client;
  }

  public static fromConfig(config: Config) {
    return new Tunisia({
      convertEmptyValues: true,
      ...config,
    });
  }

  constructor(config: Config) {
    this.client = new aws.DynamoDB.DocumentClient(config);
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

  public get(table: string) {
    return new GetBuilder(table, this);
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

  public transactWrite() {
    return new TransactionWriteBuilder(this);
  }
}
