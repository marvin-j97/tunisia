import Tunisia from "./index";
export declare class ScanBuilder {
    private $tunisia;
    private tableName;
    private indexName?;
    private filterExpression;
    private expressionAttributeNames;
    private expressionAttributeValues;
    private startKey?;
    private limitItems?;
    private projections;
    private expressionValueNameCounter;
    constructor(tableName: string, root: Tunisia);
    pick(input: string | string[]): this;
    project(input: string | string[]): this;
    index(indexName: string): this;
    private comparison;
    eq(name: string, val: any): this;
    neq(name: string, val: any): this;
    gte(name: string, val: any): this;
    lte(name: string, val: any): this;
    lt(name: string, val: any): this;
    gt(name: string, val: any): this;
    and(): this;
    or(): this;
    limit(limit: number): this;
    startAt(startKey?: AWS.DynamoDB.Key): this;
    params(): AWS.DynamoDB.ScanInput;
    exec(): Promise<import("aws-sdk/clients/dynamodb").ScanOutput>;
    run(): Promise<AWS.DynamoDB.ScanOutput>;
    all<T>(): Promise<T[]>;
    page<T>(size?: number): Promise<{
        items: T[];
        key: undefined;
    }>;
    recurse<T = any>(onItems: (items: T[], key?: AWS.DynamoDB.Key) => Promise<any>): Promise<void>;
    first<T = any>(): Promise<T | undefined>;
    get<T = any>(): Promise<T[]>;
}
