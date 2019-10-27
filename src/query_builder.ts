import { Tunisia } from "./index";
import { HashMap, AnyMap, resolveExpressionNames } from "./util";

enum ExpressionTarget {
  KEY_CONDITION,
  FILTER_EXPRESSION
}

enum SortDirection {
  ASC = "asc",
  DESC = "desc"
}

export class QueryBuilder {
  private $tunisia: Tunisia;

  private tableName: string;
  private indexName?: string;
  private keyConditionExpression: string[] = [];
  private filterExpression: string[] = [];
  private expressionAttributeNames: HashMap<string> = {};
  private expressionAttributeValues: HashMap<any> = {};
  private startKey?: AWS.DynamoDB.Key;
  private limitItems?: number;
  private scanIndexForward?: boolean;
  private projections = [] as string[];

  private expressionValueNameCounter: number = 0;
  private expressionTarget = ExpressionTarget.KEY_CONDITION;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  pick(input: string | string[]) {
    return this.project(input);
  }

  project(input: string | string[]) {
    let expressionNames = [] as string[];
    if (Array.isArray(input)) {
      expressionNames = input.map(resolveExpressionNames);
    } else {
      expressionNames = input
        .split(",")
        .map(s => resolveExpressionNames(s.trim()));
    }

    this.projections.push(...expressionNames);

    for (const name of expressionNames) {
      for (const expressionName of name.split(".")) {
        this.expressionAttributeNames[expressionName] = expressionName.replace(
          "#",
          ""
        );
      }
    }

    return this;
  }

  index(indexName: string) {
    this.indexName = indexName;
    return this;
  }

  key() {
    this.expressionTarget = ExpressionTarget.KEY_CONDITION;
    return this;
  }

  filter() {
    this.expressionTarget = ExpressionTarget.FILTER_EXPRESSION;
    return this;
  }

  private comparison(name: string, val: any, operator: string) {
    const expressionNames = resolveExpressionNames(name);
    const expressionValueName = `value${this.expressionValueNameCounter++}`;

    const expr = `${expressionNames} ${operator} :${expressionValueName}`;
    if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(expr);
    } else {
      this.filterExpression.push(expr);
    }

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[expressionName] = expressionName.replace(
        "#",
        ""
      );
    }

    this.expressionAttributeValues[`:${expressionValueName}`] = val;
    return this;
  }

  eq(name: string, val: any) {
    return this.comparison(name, val, "=");
  }

  neq(name: string, val: any) {
    return this.comparison(name, val, "<>");
  }

  ge(name: string, val: any) {
    return this.comparison(name, val, ">=");
  }

  le(name: string, val: any) {
    return this.comparison(name, val, "<=");
  }

  lt(name: string, val: any) {
    return this.comparison(name, val, "<");
  }

  gt(name: string, val: any) {
    return this.comparison(name, val, ">");
  }

  beginsWith(name: string, substr: string) {
    return this.startsWith(name, substr);
  }

  startsWith(name: string, substr: string) {
    const expressionNames = resolveExpressionNames(name);
    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[expressionName] = expressionName.replace(
        "#",
        ""
      );
    }

    const valueName = `value${this.expressionValueNameCounter++}`;
    this.expressionAttributeValues[`:${valueName}`] = substr;

    const expr = `begins_with(${expressionNames}, :${valueName})`;

    if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(expr);
    } else {
      this.filterExpression.push(expr);
    }

    return this;
  }

  between(name: string, valA: any, valB: any) {
    const expressionNames = resolveExpressionNames(name);
    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[expressionName] = expressionName.replace(
        "#",
        ""
      );
    }

    const valAName = `value${this.expressionValueNameCounter++}`;
    const valBName = `value${this.expressionValueNameCounter++}`;

    this.expressionAttributeValues[`:${valAName}`] = valA;
    this.expressionAttributeValues[`:${valBName}`] = valB;

    const expr = `${expressionNames} BETWEEN :${valAName} AND :${valBName}`;

    if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(expr);
    } else {
      this.filterExpression.push(expr);
    }

    return this;
  }

  and() {
    if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(`and`);
    } else {
      this.filterExpression.push(`and`);
    }
    return this;
  }

  or() {
    if (this.expressionTarget == ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(`or`);
    } else {
      this.filterExpression.push(`or`);
    }
    return this;
  }

  asc() {
    this.scanIndexForward = true;
    return this;
  }

  desc() {
    this.scanIndexForward = false;
    return this;
  }

  sort(dir: SortDirection | ("asc" | "desc")) {
    if (dir == SortDirection.ASC) this.asc();
    else this.desc();
    return this;
  }

  limit(limit: number) {
    this.limitItems = limit;
    return this;
  }

  startAt(startKey?: AWS.DynamoDB.Key) {
    this.startKey = startKey;
    return this;
  }

  buildParams(): AWS.DynamoDB.QueryInput {
    if (!this.tableName || !this.tableName.length)
      throw new Error("DEFINE TABLE");

    return {
      TableName: this.tableName,
      IndexName: this.indexName,
      KeyConditionExpression: this.keyConditionExpression.join(" "),
      FilterExpression: this.filterExpression.join(" ") || undefined,
      ExpressionAttributeNames: this.expressionAttributeNames,
      ExpressionAttributeValues: this.expressionAttributeValues,
      ExclusiveStartKey: this.startKey,
      Limit: this.limitItems,
      ScanIndexForward: this.scanIndexForward,
      ProjectionExpression: this.projections.join(",") || undefined
    };
  }

  run(): Promise<AWS.DynamoDB.QueryOutput> {
    return this.$tunisia
      .getClient()
      .query(this.buildParams())
      .promise();
  }

  async unique<T>(mapper?: (obj: AnyMap) => T): Promise<AnyMap | undefined> {
    try {
      const item = (await this.items())[0];

      if (mapper) {
        return mapper(item);
      }
      return item;
    } catch (err) {
      throw err;
    }
  }

  async items<T>(mapper?: (obj: AnyMap) => T): Promise<AnyMap[]> {
    try {
      const result = await this.run();

      const items = result.Items;

      if (items) {
        if (mapper) {
          return items.map(mapper);
        }
        return items;
      }
      return [];
    } catch (err) {
      throw err;
    }
  }
}
