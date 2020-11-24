import aws from "aws-sdk";
import { QueryBuilder } from "./query_builder";
import { ScanBuilder } from "./scan_builder";
import { UpdateBuilder } from "./update_builder";
import { DeleteBuilder } from "./delete_builder";
import { PutBuilder } from "./put_builder";
import { BatchGetBuilder } from "./get_builder";

export const STOP = Symbol();

type Config = aws.DynamoDB.DocumentClient.DocumentClientOptions &
  aws.DynamoDB.Types.ClientConfiguration;

export default class Tunisia {
  // private db: aws.DynamoDB;
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
    // this.db = new aws.DynamoDB(config);
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
    return new BatchGetBuilder(table, this);
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
  public edit(table: string) {
    return this.update(table);
  }
}
