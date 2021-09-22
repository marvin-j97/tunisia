import { DynamoDB } from "aws-sdk";
import Tunisia from "./index";
import { HashMap, resolveExpressionNames } from "./util";

export class ScanBuilder {
  private $tunisia: Tunisia;

  private tableName: string;
  private indexName?: string;
  private filterExpression: string[] = [];
  private expressionAttributeNames: HashMap<string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private expressionAttributeValues: HashMap<any> = {};
  private startKey?: AWS.DynamoDB.Key;
  private limitItems?: number;
  private projections: string[] = [];

  private expressionValueNameCounter = 0;

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

  private comparison(name: string, val: any, operator: string): this {
    const expressionNames = resolveExpressionNames(name);
    const expressionValueName = `value${this.expressionValueNameCounter++}`;

    this.filterExpression.push(`${expressionNames} ${operator} :${expressionValueName}`);

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[`${expressionName}`] = expressionName.replace("#", "");
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

  and(): this {
    this.filterExpression.push(`and`);
    return this;
  }

  or(): this {
    this.filterExpression.push(`or`);
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

  params(): AWS.DynamoDB.ScanInput {
    return {
      TableName: this.tableName,
      IndexName: this.indexName,
      FilterExpression: this.filterExpression.join(" ") || undefined,
      ExpressionAttributeNames: Object.keys(this.expressionAttributeNames).length
        ? this.expressionAttributeNames
        : undefined,
      ExpressionAttributeValues: Object.keys(this.expressionAttributeValues).length
        ? this.expressionAttributeValues
        : undefined,
      ExclusiveStartKey: this.startKey,
      Limit: this.limitItems,
      ProjectionExpression: this.projections.join(",") || undefined,
    };
  }

  exec() {
    return this.run();
  }

  run(): Promise<AWS.DynamoDB.ScanOutput> {
    return this.$tunisia.getClient().scan(this.params()).promise();
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
      } else {
        break;
      }
    }
  }

  async first<T>(): Promise<T | null> {
    const items = await this.get<T>();
    return items[0] || null;
  }

  async get<T>(): Promise<T[]> {
    const result = await this.run();
    if (result.Items) {
      return result.Items as unknown as T[];
    }
    return [];
  }
}
