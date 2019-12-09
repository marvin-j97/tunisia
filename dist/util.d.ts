export interface HashMap<T> {
    [key: string]: T;
}
export declare type StringMap = HashMap<string>;
export declare type AnyMap = HashMap<any>;
export declare function resolveExpressionNames(str: string): string;
