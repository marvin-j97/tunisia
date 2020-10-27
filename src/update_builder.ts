import Tunisia from "./index";
import { resolveExpressionNames, HashMap } from "./util";

export class UpdateBuilder {
  private $tunisia: Tunisia;

  private tableName: string;
  private keys: HashMap<any> = {};
  private expressionAttributeNames: HashMap<string> = {};
  private expressionAttributeValues: HashMap<any> = {};

  private setExpressions: { name: string; value: string }[] = [];
  private addExpressions: { name: string; value: string }[] = [];
  private removeExpressions: string[] = [];
  private expressionValueNameCounter: number = 0;

  constructor(tableName: string, root: Tunisia) {
    this.tableName = tableName;
    this.$tunisia = root;
  }

  private buildUpdateExpression(): string {
    const expressions = [] as string[];
    if (Object.keys(this.setExpressions).length) {
      expressions.push(
        `SET ${this.setExpressions
          .map((i) => `${i.name} = ${i.value}`)
          .join(", ")}`
      );
    }

    if (Object.keys(this.addExpressions).length) {
      expressions.push(
        `ADD ${this.addExpressions
          .map((i) => `${i.name} ${i.value}`)
          .join(", ")}`
      );
    }

    if (Object.keys(this.removeExpressions).length) {
      expressions.push(`REMOVE ${this.removeExpressions.join(", ")}`);
    }

    return expressions.join(" ");
  }

  key(name: string, value: any) {
    this.keys[name] = value;
    return this;
  }

  set(name: string, value: any) {
    const expressionNames = resolveExpressionNames(name);

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[
        `${expressionName}`
      ] = expressionName.replace("#", "");
    }

    this.expressionAttributeValues[
      `:value${this.expressionValueNameCounter}`
    ] = value;
    this.setExpressions.push({
      name: expressionNames,
      value: `:value${this.expressionValueNameCounter}`,
    });

    this.expressionValueNameCounter++;

    return this;
  }

  add(name: string, value: any) {
    const expressionNames = resolveExpressionNames(name);

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[
        `${expressionName}`
      ] = expressionName.replace("#", "");
    }

    this.expressionAttributeValues[
      `:value${this.expressionValueNameCounter}`
    ] = value;
    this.addExpressions.push({
      name: expressionNames,
      value: `:value${this.expressionValueNameCounter}`,
    });

    this.expressionValueNameCounter++;

    return this;
  }

  remove(name: string) {
    const expressionNames = resolveExpressionNames(name);

    for (const expressionName of expressionNames.split(".")) {
      this.expressionAttributeNames[
        `${expressionName}`
      ] = expressionName.replace("#", "");
    }

    this.removeExpressions.push(expressionNames);
    return this;
  }

  params(): AWS.DynamoDB.UpdateItemInput {
    return {
      TableName: this.tableName,
      Key: this.keys,
      UpdateExpression: this.buildUpdateExpression(),
      ExpressionAttributeNames: this.expressionAttributeNames,
      ExpressionAttributeValues: Object.keys(this.expressionAttributeValues)
        .length
        ? this.expressionAttributeValues
        : undefined,
    };
  }

  exec() {
    return this.run();
  }

  run(): Promise<AWS.DynamoDB.UpdateItemOutput> {
    return this.$tunisia.getClient().update(this.params()).promise();
  }
}
