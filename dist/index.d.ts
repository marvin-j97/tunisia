import aws, { DynamoDB } from "aws-sdk";
import { QueryBuilder } from "./query_builder";
import { ScanBuilder } from "./scan_builder";
import { UpdateBuilder } from "./update_builder";
import { DeleteBuilder } from "./delete_builder";
import { PutBuilder } from "./put_builder";
export declare const STOP: unique symbol;
export declare class Tunisia {
    private client;
    getClient(): DynamoDB.DocumentClient;
    static fromConfig(config: aws.DynamoDB.DocumentClient.DocumentClientOptions): Tunisia;
    static fromClient(client: aws.DynamoDB.DocumentClient): Tunisia;
    constructor(config: aws.DynamoDB.DocumentClient.DocumentClientOptions | aws.DynamoDB.DocumentClient);
    create(table: string): PutBuilder;
    insert(table: string): PutBuilder;
    put(table: string): PutBuilder;
    delete(table: string): DeleteBuilder;
    remove(table: string): DeleteBuilder;
    query(table: string): QueryBuilder;
    scan(table: string): ScanBuilder;
    change(table: string): UpdateBuilder;
    update(table: string): UpdateBuilder;
}
