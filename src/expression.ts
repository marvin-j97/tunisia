// See docs: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html

import { DotNestedKeys } from "./path";
import { dejoinExpressionPath } from "./util";

/**
 * Stores expression names and values
 */
export class ExpressionTranslator {
  readonly expressionAttributeNames: Record<string, string> = {};
  readonly expressionAttributeValues: Record<string, unknown> = {};
  private nameCounter = 0;
  private valueCounter = 0;

  getName(name: string): string {
    const pathSegments = dejoinExpressionPath(name);
    const resolvedSegments: string[] = [];

    for (const segment of pathSegments) {
      const existing = Object.entries(this.expressionAttributeNames).find(
        ([_, value]) => segment === value,
      );

      if (existing) {
        // Reuse translated key
        const [key] = existing;
        resolvedSegments.push(key);
      } else {
        // Create a new key
        const newName = `#n${this.nameCounter++}`;
        this.expressionAttributeNames[newName] = segment;
        resolvedSegments.push(newName);
      }
    }

    return resolvedSegments.join(".");
  }

  getValueName(value: unknown): string {
    const newName = `:v${this.valueCounter++}`;
    this.expressionAttributeValues[newName] = value;
    return newName;
  }

  getMaps() {
    return {
      ExpressionAttributeNames: Object.keys(this.expressionAttributeNames).length
        ? this.expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: Object.keys(this.expressionAttributeValues).length
        ? this.expressionAttributeValues
        : undefined,
    };
  }
}

/**
 * Represents some operator that can be converted to a string
 */
export interface IOperator {
  toString(translator: ExpressionTranslator): string;
}

type ComparisonOperation = "=" | "<>" | "<" | "<=" | ">" | ">=";

export type DynamoInternalType = "S" | "SS" | "N" | "NS" | "B" | "BS" | "BOOL" | "NULL" | "L" | "M";

export type DynamoType =
  | "String"
  | "StringSet"
  | "Number"
  | "NumberSet"
  | "Binary"
  | "BinarySet"
  | "Boolean"
  | "Null"
  | "List"
  | "Map";

const dynamoTypeMap: Record<DynamoType, DynamoInternalType> = {
  String: "S",
  StringSet: "SS",
  Number: "N",
  NumberSet: "NS",
  Binary: "B",
  BinarySet: "BS",
  Boolean: "BOOL",
  Null: "NULL",
  List: "L",
  Map: "M",
};

/**
 * attribute_exists function
 */
class AttributeTypeFunction<T extends Record<string, unknown>> implements IOperator {
  private param: keyof T;
  private typeIdent: DynamoType;

  constructor(param: keyof T, typeIdent: DynamoType) {
    this.param = param;
    this.typeIdent = typeIdent;
  }

  toString(translator: ExpressionTranslator): string {
    return `attribute_type(${translator.getName(this.param as string)}, ${translator.getValueName(
      dynamoTypeMap[this.typeIdent],
    )})`;
  }
}

/**
 * attribute_exists function
 */
class AttributeExistsFunction<T extends Record<string, unknown>> implements IOperator {
  private param: keyof T;

  constructor(param: keyof T) {
    this.param = param;
  }

  toString(translator: ExpressionTranslator): string {
    return `attribute_exists(${translator.getName(this.param as string)})`;
  }
}

/**
 * attribute_not_exists function
 */
class AttributeNotExistsFunction<T extends Record<string, unknown>> implements IOperator {
  private param: keyof T;

  constructor(param: keyof T) {
    this.param = param;
  }

  toString(translator: ExpressionTranslator): string {
    return `attribute_not_exists(${translator.getName(this.param as string)})`;
  }
}

/**
 * begins_with function
 */
class BeginsWithFunction<T extends Record<string, unknown>> implements IOperator {
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
class ContainsFunction<T extends Record<string, unknown>> implements IOperator {
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
class BetweenOperator<T extends Record<string, unknown>> implements IOperator {
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
class InOperator<T extends Record<string, unknown>> implements IOperator {
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
class ComparisonOperator<T extends Record<string, unknown>> implements IOperator {
  private lhs: keyof T;
  private rhs: Atomic;
  private op: ComparisonOperation;

  constructor(lhs: keyof T, rhs: Atomic, op: ComparisonOperation) {
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
  private operands: IOperator[];

  constructor(operands: IOperator[]) {
    this.operands = operands;
  }

  toString(translator: ExpressionTranslator): string {
    return this.operands.map((op) => `(${op.toString(translator)})`).join(" AND ");
  }
}

/**
 * OR operator
 */
class OrOperator implements IOperator {
  private operands: IOperator[];

  constructor(operands: IOperator[]) {
    this.operands = operands;
  }

  toString(translator: ExpressionTranslator): string {
    return this.operands.map((op) => `(${op.toString(translator)})`).join(" OR ");
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
export function and(operands: IOperator[]): AndOperator {
  return new AndOperator(operands);
}

/**
 * Creates a new OR expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns OR operator
 */
export function or(operands: IOperator[]): OrOperator {
  return new OrOperator(operands);
}

/**
 * Creates a new IN expression
 *
 * @param lhs Left-hand side operand
 * @param values Right-hand side operand
 * @returns Comparison operator
 */
export function _in<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
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
export function between<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
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
export function contains<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
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
export function beginsWith<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: string,
): BeginsWithFunction<T> {
  return new BeginsWithFunction(lhs, rhs);
}

export type Atomic = string | number | boolean | null;
export type TypedKeyOf<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Creates a new = expression
 *
 * @param lhs Left-hand side operand
 * @param rhs Right-hand side operand
 * @returns Comparison operator
 */
export function eq<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: Atomic,
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
export function neq<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: Atomic,
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
export function gt<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: string | number,
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
export function gte<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: string | number,
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
export function lt<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: string | number,
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
export function lte<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  lhs: K,
  rhs: string | number,
): ComparisonOperator<T> {
  return new ComparisonOperator(lhs, rhs, "<=");
}

/**
 * Creates a new attribute_exists expression
 *
 * @param key Left-hand side operand
 * @returns attribute_exists function
 */
export function attributeExists<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  key: K,
): AttributeExistsFunction<T> {
  return new AttributeExistsFunction(key);
}

/**
 * Creates a new attribute_not_exists expression_
 *
 * @param key Left-hand side operand
 * @returns attribute_not_exists function
 */
export function attributeNotExists<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  key: K,
): AttributeNotExistsFunction<T> {
  return new AttributeNotExistsFunction(key);
}

/**
 * Creates a new attribute_type expression_
 *
 * @param key Left-hand side operand
 * @returns attribute_type function
 */
export function attributeType<T extends Record<string, unknown>, K extends DotNestedKeys<T>>(
  key: K,
  typeIdent: DynamoType,
): AttributeTypeFunction<T> {
  return new AttributeTypeFunction(key, typeIdent);
}
