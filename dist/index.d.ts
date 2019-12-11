import aws from "aws-sdk";
import { QueryBuilder } from "./query_builder";
import { ScanBuilder } from "./scan_builder";
import { UpdateBuilder } from "./update_builder";
import { DeleteBuilder } from "./delete_builder";
import { PutBuilder } from "./put_builder";
export declare const STOP: unique symbol;
export default class Tunisia {
    private client;
    getClient(): aws.DynamoDB.DocumentClient;
    static fromConfig(config: aws.DynamoDB.DocumentClient.DocumentClientOptions): Tunisia;
    static fromClient(client: aws.DynamoDB.DocumentClient): Tunisia;
    constructor(config: aws.DynamoDB.DocumentClient.DocumentClientOptions | aws.DynamoDB.DocumentClient);
    insert(table: string): PutBuilder;
    create(table: string): PutBuilder;
    put(table: string): PutBuilder;
    delete(table: string): DeleteBuilder;
    remove(table: string): DeleteBuilder;
    query(table: string): QueryBuilder;
    scan(table: string): ScanBuilder;
    update(table: string): UpdateBuilder;
    change(table: string): UpdateBuilder;
}
