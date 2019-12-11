import Tunisia from "./index";
export declare class DeleteBuilder {
    private $tunisia;
    private tableName;
    constructor(tableName: string, root: Tunisia);
    one(key: string, value: string | number): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.DeleteItemOutput, import("aws-sdk").AWSError>>;
    buildBatch(key: string, values: (string | number)[]): {
        DeleteRequest: {
            Key: {
                [x: string]: string | number;
            };
        };
    }[];
    many(key: string, values: string[] | number[]): Promise<void>;
}
