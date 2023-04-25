// See docs: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html

/**
 * Stores expression names and values
 */
export class ExpressionTranslator {
  readonly expressionAttributeNames: Record<string, string> = {};
  readonly expressionAttributeValues: Record<string, unknown> = {};
  private nameCounter = 0;
  private valueCounter = 0;

  getName(name: string): string {
    // TODO: resolveExpressionNames
    if (!(name in this.expressionAttributeNames)) {
      const newName = `#name${this.nameCounter++}`;
      this.expressionAttributeNames[newName] = name;
      return newName;
    }
    return this.expressionAttributeNames[name];
  }

  getValueName(value: unknown): string {
    const newName = `:value${this.valueCounter++}`;
    this.expressionAttributeValues[newName] = value;
    return newName;
  }
}

/**
 * Represents some operator that can be converted to a string
 */
export interface IOperator {
  toString(translator: ExpressionTranslator): string;
}

type ComparisonOperation = "=" | "<>" | "<" | "<=" | ">" | ">=";

/**
 * begins_with function
 */
class BeginsWithFunction<T extends Record<string, string | number | boolean>> implements IOperator {
  private param: keyof T;
  private substr: string;

  constructor(param: keyof T, substr: string) {
    this.param = param;
    this.substr = substr;
  }

  toString(translator: ExpressionTranslator): string {
    return `begins_with(${translator.getName(this.param as string)}, ${translator.getValueName(
      this.substr,
    )})`;
  }
}

/**
 * contains function
 */
class ContainsFunction<T extends Record<string, string | number | boolean>> implements IOperator {
  private param: keyof T;
  private substr: string;

  constructor(param: keyof T, substr: string) {
    this.param = param;
    this.substr = substr;
  }

  toString(translator: ExpressionTranslator): string {
    return `contains(${translator.getName(this.param as string)}, ${translator.getValueName(
      this.substr,
    )})`;
  }
}

/**
 * Between operator
 */
class BetweenOperator<T extends Record<string, string | number | boolean>> implements IOperator {
  private lhs: keyof T;
  private min: string | number;
  private max: string | number;

  constructor(lhs: keyof T, min: string | number, max: string | number) {
    this.lhs = lhs;
    this.min = min;
    this.max = max;
  }

  toString(translator: ExpressionTranslator): string {
    const lhs = translator.getName(this.lhs as string);
    const min = translator.getValueName(this.min);
    const max = translator.getValueName(this.max);
    return `${lhs} BETWEEN ${min} AND ${max}`;
  }
}

/**
 * In operator
 */
class InOperator<T extends Record<string, string | number | boolean>> implements IOperator {
  private lhs: keyof T;
  private values: (string | number | boolean)[];

  constructor(lhs: keyof T, values: (string | number | boolean)[]) {
    this.lhs = lhs;
    if (values.length > 100) {
      throw new Error("IN operator: cannot have more than 100 values");
    }
    this.values = values;
  }

  toString(translator: ExpressionTranslator): string {
    const lhs = translator.getName(this.lhs as string);
    return `${lhs} IN (${this.values.map((x) => translator.getValueName(x)).join(", ")})`;
  }
}

/**
 * Comparison operator
 */
class ComparisonOperator<T extends Record<string, string | number | boolean>> implements IOperator {
  private lhs: keyof T;
  private rhs: string | number | boolean;
  private op: ComparisonOperation;

  constructor(lhs: keyof T, rhs: string | number | boolean, op: ComparisonOperation) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.op = op;
  }

  toString(translator: ExpressionTranslator): string {
    const lhs = translator.getName(this.lhs as string);
    const rhs = translator.getValueName(this.rhs);
    return `${lhs} ${this.op} ${rhs}`;
  }
}

/**
 * NOT operator
 */
class NotOperator implements IOperator {
  private param: IOperator;

  constructor(param: IOperator) {
    this.param = param;
  }

  toString(translator: ExpressionTranslator): string {
    return `NOT (${this.param.toString(translator)})`;
  }
}

/**
 * AND operator
 */
class AndOperator implements IOperator {
  private lhs: IOperator;
  private rhs: IOperator;

  constructor(lhs: IOperator, rhs: IOperator) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toString(translator: ExpressionTranslator): string {
    return `(${this.lhs.toString(translator)}) AND (${this.rhs.toString(translator)})`;
  }
}

/**
 * OR operator
 */
class OrOperator implements IOperator {
  private lhs: IOperator;
  private rhs: IOperator;

  constructor(lhs: IOperator, rhs: IOperator) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toString(translator: ExpressionTranslator): string {
    return `(${this.lhs.toString(translator)}) OR (${this.rhs.toString(translator)})`;
  }
}

/**
 * Creates a new NOT expression
 *
 * @param param Expression to invert
 * @returns NOT operator
 */
export function not(param: IOperator): NotOperator {
  return new NotOperator(param);
}

/**
 * Creates a new AND expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns AND operator
 */
export function and(lhs: IOperator, rhs: IOperator): AndOperator {
  return new AndOperator(lhs, rhs);
}

/**
 * Creates a new OR expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns OR operator
 */
export function or(lhs: IOperator, rhs: IOperator): OrOperator {
  return new OrOperator(lhs, rhs);
}

/**
 * Creates a new IN expression
 *
 * @param lhs Left-hand side operand
 * @param values Right-hand side operand
 * @returns Comparison operator
 */
export function _in<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  values: (string | number | boolean)[],
): InOperator<T> {
  return new InOperator(lhs, values);
}

/**
 * Creates a new BETWEEN expression
 *
 * @param lhs Left-hand side operand
 * @param min Min value
 * @param max Max value
 * @returns Comparison operator
 */
export function between<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  min: string | number,
  max: string | number,
): BetweenOperator<T> {
  return new BetweenOperator(lhs, min, max);
}

/**
 * Creates a new contains expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function contains<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: string,
): ContainsFunction<T> {
  return new ContainsFunction(lhs, rhs);
}

/**
 * Creates a new begins_with expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function beginsWith<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: string,
): BeginsWithFunction<T> {
  return new BeginsWithFunction(lhs, rhs);
}

/**
 * Creates a new = expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function eq<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: T[K],
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, "=");
}

/**
 * Creates a new <> (not equals) expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function neq<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: T[K],
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, "<>");
}

/**
 * Creates a new > expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function gt<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: T[K],
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, ">");
}

/**
 * Creates a new >= expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function gte<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: T[K],
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, ">=");
}

/**
 * Creates a new < expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function lt<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: T[K],
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, "<");
}

/**
 * Creates a new <= expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function lte<T extends Record<string, string | number | boolean>, K extends keyof T>(
  lhs: K,
  rhs: T[K],
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, "<=");
}
