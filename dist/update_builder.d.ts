import { Tunisia } from "./index";
export declare class UpdateBuilder {
    private $tunisia;
    private tableName;
    private keys;
    private expressionAttributeNames;
    private expressionAttributeValues;
    private setExpressions;
    private addExpressions;
    private removeExpressions;
    private expressionValueNameCounter;
    constructor(tableName: string, root: Tunisia);
    private buildUpdateExpression;
    key(name: string, value: any): this;
    set(name: string, value: any): this;
    add(name: string, value: any): this;
    remove(name: string): this;
    params(): AWS.DynamoDB.UpdateItemInput;
    run(): Promise<AWS.DynamoDB.UpdateItemOutput>;
}
