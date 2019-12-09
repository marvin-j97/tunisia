import { Tunisia } from "./index";
import { AnyMap } from "./util";
declare enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}
export declare class QueryBuilder {
    private $tunisia;
    private tableName;
    private indexName?;
    private keyConditionExpression;
    private filterExpression;
    private expressionAttributeNames;
    private expressionAttributeValues;
    private startKey?;
    private limitItems?;
    private scanIndexForward?;
    private projections;
    private expressionValueNameCounter;
    private expressionTarget;
    constructor(tableName: string, root: Tunisia);
    pick(input: string | string[]): this;
    project(input: string | string[]): this;
    index(indexName: string): this;
    key(): this;
    filter(): this;
    private comparison;
    eq(name: string, val: any): this;
    neq(name: string, val: any): this;
    gte(name: string, val: any): this;
    lte(name: string, val: any): this;
    lt(name: string, val: any): this;
    gt(name: string, val: any): this;
    beginsWith(name: string, substr: string): this;
    startsWith(name: string, substr: string): this;
    between(name: string, valA: any, valB: any): this;
    and(): this;
    or(): this;
    asc(): this;
    desc(): this;
    sort(dir: SortDirection | ("asc" | "desc")): this;
    limit(limit: number): this;
    startAt(startKey?: AWS.DynamoDB.Key): this;
    params(): AWS.DynamoDB.QueryInput;
    run(): Promise<AWS.DynamoDB.QueryOutput>;
    all(): Promise<unknown[]>;
    recurse(onItems: (items: any[]) => Promise<any>): Promise<void>;
    first(): Promise<AnyMap | undefined>;
    get(): Promise<AnyMap[]>;
}
export {};
