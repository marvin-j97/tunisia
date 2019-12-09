import { Tunisia } from "./index";
import { AnyMap } from "./util";
export declare class PutBuilder {
    private $tunisia;
    private tableName;
    constructor(tableName: string, root: Tunisia);
    one(item: AnyMap): void;
    many(items: AnyMap[]): Promise<void>;
}
