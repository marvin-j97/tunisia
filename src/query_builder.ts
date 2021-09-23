import { DynamoDB } from "aws-sdk";

import Tunisia from "./index";
import { HashMap, resolveExpressionNames } from "./util";

enum ExpressionTarget {
  KEY_CONDITION,
  FILTER_EXPRESSION,
}

enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

export class QueryBuilder {
  private $tunisia: Tunisia;

  private tableName: string;
  private indexName?: string;
  private keyConditionExpression: string[] = [];
  private filterExpression: string[] = [];
  private expressionAttributeNames: HashMap<string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private expressionAttributeValues: HashMap<any> = {};
  private startKey?: AWS.DynamoDB.Key;
  private limitItems?: number;
  private scanIndexForward?: boolean;
  private projections: string[] = [];

  private expressionValueNameCounter = 0;
  private expressionTarget = ExpressionTarget.KEY_CONDITION;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  pick(input: string | string[]): this {
    return this.project(input);
  }

  project(input: string | string[]): this {
    let expressionNames = [] as string[];
    if (Array.isArray(input)) {
      expressionNames = input.map(resolveExpressionNames);
    } else {
      expressionNames = input.split(",").map((s) => resolveExpressionNames(s.trim()));
    }

    this.projections.push(...expressionNames);

    for (const name of expressionNames) {
      for (const expressionName of name.split(".")) {
        this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
      }
    }

    return this;
  }

  index(indexName: string): this {
    this.indexName = indexName;
    return this;
  }

  key(): this {
    this.expressionTarget = ExpressionTarget.KEY_CONDITION;
    return this;
  }

  filter(): this {
    this.expressionTarget = ExpressionTarget.FILTER_EXPRESSION;
    return this;
  }

  private comparison(name: string, val: any, operator: string): this {
    const expressionNames = resolveExpressionNames(name);
    const expressionValueName = `value${this.expressionValueNameCounter++}`;

    const expr = `${expressionNames} ${operator} :${expressionValueName}`;
    if (this.expressionTarget === ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(expr);
    } else {
      this.filterExpression.push(expr);
    }

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
    }

    this.expressionAttributeValues[`:${expressionValueName}`] = val;
    return this;
  }

  eq(name: string, val: any): this {
    return this.comparison(name, val, "=");
  }

  neq(name: string, val: any): this {
    return this.comparison(name, val, "<>");
  }

  gte(name: string, val: any): this {
    return this.comparison(name, val, ">=");
  }

  lte(name: string, val: any): this {
    return this.comparison(name, val, "<=");
  }

  lt(name: string, val: any): this {
    return this.comparison(name, val, "<");
  }

  gt(name: string, val: any): this {
    return this.comparison(name, val, ">");
  }

  beginsWith(name: string, substr: string): this {
    return this.startsWith(name, substr);
  }

  startsWith(name: string, substr: string): this {
    const expressionNames = resolveExpressionNames(name);
    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
    }

    const valueName = `value${this.expressionValueNameCounter++}`;
    this.expressionAttributeValues[`:${valueName}`] = substr;

    const expr = `begins_with(${expressionNames}, :${valueName})`;

    if (this.expressionTarget === ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(expr);
    } else {
      this.filterExpression.push(expr);
    }

    return this;
  }

  between(name: string, valA: any, valB: any): this {
    const expressionNames = resolveExpressionNames(name);
    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[expressionName] = expressionName.replace("#", "");
    }

    const valAName = `value${this.expressionValueNameCounter++}`;
    const valBName = `value${this.expressionValueNameCounter++}`;

    this.expressionAttributeValues[`:${valAName}`] = valA;
    this.expressionAttributeValues[`:${valBName}`] = valB;

    const expr = `${expressionNames} BETWEEN :${valAName} AND :${valBName}`;

    if (this.expressionTarget === ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(expr);
    } else {
      this.filterExpression.push(expr);
    }

    return this;
  }

  and(): this {
    if (this.expressionTarget === ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(`and`);
    } else {
      this.filterExpression.push(`and`);
    }
    return this;
  }

  or(): this {
    if (this.expressionTarget === ExpressionTarget.KEY_CONDITION) {
      this.keyConditionExpression.push(`or`);
    } else {
      this.filterExpression.push(`or`);
    }
    return this;
  }

  asc(): this {
    this.scanIndexForward = true;
    return this;
  }

  desc(): this {
    this.scanIndexForward = false;
    return this;
  }

  sort(dir: SortDirection | ("asc" | "desc")): this {
    if (dir === SortDirection.ASC) {
      this.asc();
    } else {
      this.desc();
    }
    return this;
  }

  limit(limit: number): this {
    this.limitItems = limit;
    return this;
  }

  startAt(startKey?: AWS.DynamoDB.Key): this {
    this.startKey = startKey;
    return this;
  }

  params(): AWS.DynamoDB.QueryInput {
    return {
      TableName: this.tableName,
      IndexName: this.indexName,
      KeyConditionExpression: this.keyConditionExpression.join(" "),
      FilterExpression: this.filterExpression.join(" ") || undefined,
      ExpressionAttributeNames: Object.keys(this.expressionAttributeNames).length
        ? this.expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: Object.keys(this.expressionAttributeValues).length
        ? this.expressionAttributeValues
        : undefined,
      ExclusiveStartKey: this.startKey,
      Limit: this.limitItems,
      ScanIndexForward: this.scanIndexForward,
      ProjectionExpression: this.projections.join(",") || undefined,
    };
  }

  exec() {
    return this.run();
  }

  run(): Promise<AWS.DynamoDB.QueryOutput> {
    return this.$tunisia.getClient().query(this.params()).promise();
  }

  async all<T>() {
    const collected: T[] = [];

    for await (const page of this.iterate<T>()) {
      collected.push(...page.items);
    }

    return collected;
  }

  async *iterate<T>(): AsyncGenerator<{
    items: T[];
    key: DynamoDB.DocumentClient.Key | undefined;
  }> {
    const params = this.params();
    while (true) {
      const queryResult = await this.$tunisia.getClient().query(params).promise();

      if (queryResult.Items && queryResult.Items.length) {
        if (queryResult.LastEvaluatedKey) {
          params.ExclusiveStartKey = queryResult.LastEvaluatedKey;
        }
        yield {
          items: queryResult.Items,
          key: queryResult.LastEvaluatedKey,
        } as {
          items: T[];
          key: typeof queryResult.LastEvaluatedKey;
        };
        if (!queryResult.LastEvaluatedKey) {
          break;
        }
      } else {
        break;
      }
    }
  }

  async first<T>(): Promise<T | null> {
    const items = await this.get<T>();
    return items[0] || null;
  }

  async page<T>(): Promise<{ items: T[]; key: DynamoDB.Key | undefined }> {
    const result = await this.run();
    if (result.Items) {
      return {
        items: result.Items as unknown as T[],
        key: result.LastEvaluatedKey,
      };
    }
    return {
      items: [],
      key: undefined,
    };
  }

  async get<T>(): Promise<T[]> {
    const { items } = await this.page<T>();
    return items;
  }
}
