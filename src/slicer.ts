/**
 * Creates an iterator over slices of an array
 */
export function* sliceGenerator<T>(arr: T[], size: number): Generator<T[]> {
  let index = 0;
  let slice = arr.slice(index, index + size);
  while (slice.length) {
    yield slice;
    index += size;
    slice = arr.slice(index, index + size);
  }
}
