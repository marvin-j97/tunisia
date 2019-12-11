"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const query_builder_1 = require("./query_builder");
const scan_builder_1 = require("./scan_builder");
const update_builder_1 = require("./update_builder");
const delete_builder_1 = require("./delete_builder");
const put_builder_1 = require("./put_builder");
exports.STOP = Symbol();
class Tunisia {
    constructor(config) {
        if (config instanceof aws_sdk_1.default.DynamoDB.DocumentClient) {
            this.client = config;
        }
        else {
            this.client = new aws_sdk_1.default.DynamoDB.DocumentClient(config);
        }
    }
    getClient() {
        return this.client;
    }
    static fromConfig(config) {
        return new Tunisia(config);
    }
    static fromClient(client) {
        return new Tunisia(client);
    }
    insert(table) {
        return new put_builder_1.PutBuilder(table, this);
    }
    create(table) {
        return this.insert(table);
    }
    put(table) {
        return this.insert(table);
    }
    delete(table) {
        return new delete_builder_1.DeleteBuilder(table, this);
    }
    remove(table) {
        return this.delete(table);
    }
    query(table) {
        return new query_builder_1.QueryBuilder(table, this);
    }
    scan(table) {
        return new scan_builder_1.ScanBuilder(table, this);
    }
    update(table) {
        return new update_builder_1.UpdateBuilder(table, this);
    }
    change(table) {
        return this.update(table);
    }
}
exports.default = Tunisia;
