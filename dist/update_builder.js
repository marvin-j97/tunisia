"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
class UpdateBuilder {
    constructor(tableName, root) {
        this.keys = {};
        this.expressionAttributeNames = {};
        this.expressionAttributeValues = {};
        this.setExpressions = [];
        this.addExpressions = [];
        this.removeExpressions = [];
        this.expressionValueNameCounter = 0;
        this.tableName = tableName;
        this.$tunisia = root;
    }
    buildUpdateExpression() {
        const expressions = [];
        if (Object.keys(this.setExpressions).length) {
            expressions.push(`SET ${this.setExpressions
                .map(i => `${i.name} = ${i.value}`)
                .join(", ")}`);
        }
        if (Object.keys(this.addExpressions).length) {
            expressions.push(`ADD ${this.addExpressions.map(i => `${i.name} ${i.value}`).join(", ")}`);
        }
        if (Object.keys(this.removeExpressions).length) {
            expressions.push(`REMOVE ${this.removeExpressions.join(", ")}`);
        }
        return expressions.join(" ");
    }
    key(name, value) {
        this.keys[name] = value;
        return this;
    }
    set(name, value) {
        const expressionNames = util_1.resolveExpressionNames(name);
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[`${expressionName}`] = expressionName.replace("#", "");
        }
        this.expressionAttributeValues[`:value${this.expressionValueNameCounter}`] = value;
        this.setExpressions.push({
            name: expressionNames,
            value: `:value${this.expressionValueNameCounter}`
        });
        this.expressionValueNameCounter++;
        return this;
    }
    add(name, value) {
        const expressionNames = util_1.resolveExpressionNames(name);
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[`${expressionName}`] = expressionName.replace("#", "");
        }
        this.expressionAttributeValues[`:value${this.expressionValueNameCounter}`] = value;
        this.addExpressions.push({
            name: expressionNames,
            value: `:value${this.expressionValueNameCounter}`
        });
        this.expressionValueNameCounter++;
        return this;
    }
    remove(name) {
        const expressionNames = util_1.resolveExpressionNames(name);
        for (const expressionName of expressionNames.split(".")) {
            this.expressionAttributeNames[`${expressionName}`] = expressionName.replace("#", "");
        }
        this.removeExpressions.push(expressionNames);
        return this;
    }
    params() {
        return {
            TableName: this.tableName,
            Key: this.keys,
            UpdateExpression: this.buildUpdateExpression(),
            ExpressionAttributeNames: this.expressionAttributeNames,
            ExpressionAttributeValues: this.expressionAttributeValues
        };
    }
    run() {
        return this.$tunisia
            .getClient()
            .update(this.params())
            .promise();
    }
}
exports.UpdateBuilder = UpdateBuilder;
