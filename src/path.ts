type Key = string | number | symbol;

type Join<L extends Key | undefined, R extends Key | undefined> = L extends string | number
  ? R extends string | number
    ? `${L}.${R}`
    : L
  : R extends string | number
  ? R
  : undefined;

type Union<L extends unknown | undefined, R extends unknown | undefined> = L extends undefined
  ? R extends undefined
    ? undefined
    : R
  : R extends undefined
  ? L
  : L | R;

// Use this type to define object types you want to skip (no path-scanning)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ObjectsToIgnore = { new (...parms: any[]): any } | Date | Array<any>;

type ValidObject<T> = T extends object ? (T extends ObjectsToIgnore ? false & 1 : T) : false & 1;

export type DotNestedKeys<
  T extends object,
  Prev extends Key | undefined = undefined,
  Path extends Key | undefined = undefined,
  PrevTypes extends object = T,
> = string &
  {
    [K in keyof T]: T[K] extends PrevTypes | T // T[K] is a type alredy checked?
      ? //  Return all previous paths.
        Union<Union<Prev, Path>, Join<Path, K>>
      : // T[K] is an object?.
      Required<T>[K] extends ValidObject<Required<T>[K]>
      ? // Continue extracting
        DotNestedKeys<Required<T>[K], Union<Prev, Path>, Join<Path, K>, PrevTypes | T>
      : // Return all previous paths, including current key.
        Union<Union<Prev, Path>, Join<Path, K>>;
  }[keyof T];

type Head<T extends string> = T extends `${infer First}.${string}` ? First : T;

type Tail<T extends string> = T extends `${string}.${infer Rest}` ? Rest : never;

export type DeepPick<T, K extends string> = T extends object
  ? {
      [P in Head<K> & keyof T]: T[P] extends readonly unknown[]
        ? DeepPick<T[P][number], Tail<Extract<K, `${P}.${string}`>>>[]
        : DeepPick<T[P], Tail<Extract<K, `${P}.${string}`>>>;
    }
  : T;
