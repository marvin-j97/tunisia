export function dejoinExpressionPath(str: string): string[] {
  return str.split(".").filter((s) => s.length);
}

export const MAX_BATCH_SIZE = 25;
