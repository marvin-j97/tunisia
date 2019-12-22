export interface HashMap<T> {
    [key: string]: T;
}
export declare type StringMap = HashMap<string>;
export declare type AnyMap = HashMap<any>;
export declare function resolveExpressionNames(str: string): string;
export declare function mapAsync<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]>;
export declare function filterAsync<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]>;
