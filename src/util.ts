export function dejoinExpressionPath(str: string): string[] {
  return str.split(".").filter((s) => s.length);
}
