export function dejoinExpressionPath(str: string): string[] {
  return str.split(".").filter((s) => s.length);
}

export const MAX_GET_BATCH_SIZE = 100;
export const MAX_WRITE_BATCH_SIZE = 25;
