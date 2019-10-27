export interface HashMap<T> {
  [key: string]: T;
}

export type AnyMap = HashMap<any>;

export function resolveExpressionNames(str: string) {
  return str
    .split(".")
    .filter(s => s.length)
    .map(s => `#${s}`)
    .join(".");
}
