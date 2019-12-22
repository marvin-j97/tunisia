export interface HashMap<T> {
  [key: string]: T;
}

export type StringMap = HashMap<string>;
export type AnyMap = HashMap<any>;

export function resolveExpressionNames(str: string) {
  return str
    .split(".")
    .filter(s => s.length)
    .map(s => `#${s}`)
    .join(".");
}

export function mapAsync<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}

export async function filterAsync<T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>
): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((_, index) => filterMap[index]);
}
