import Tunisia from "./index";
import { AnyMap } from "./util";
export declare class PutBuilder {
    private $tunisia;
    private tableName;
    constructor(tableName: string, root: Tunisia);
    one(item: AnyMap): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk").AWSError>>;
    many(items: AnyMap[]): Promise<void>;
}
