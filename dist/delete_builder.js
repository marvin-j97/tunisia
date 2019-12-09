"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class DeleteBuilder {
    constructor(tableName, root) {
        this.tableName = tableName;
        this.$tunisia = root;
    }
    one(key, value) {
        return this.$tunisia
            .getClient()
            .delete({
            TableName: this.tableName,
            Key: {
                [key]: value
            }
        })
            .promise();
    }
    buildBatch(key, values) {
        return values.map(value => {
            return {
                DeleteRequest: {
                    Key: {
                        [key]: value
                    }
                }
            };
        });
    }
    many(key, values) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const BATCH_SIZE = 25;
                let index = 0;
                let slice = values.slice(index, index + BATCH_SIZE);
                do {
                    const params = {
                        RequestItems: {
                            [this.tableName]: this.buildBatch(key, slice)
                        }
                    };
                    yield this.$tunisia
                        .getClient()
                        .batchWrite(params)
                        .promise();
                    index += BATCH_SIZE;
                    slice = values.slice(index, index + BATCH_SIZE);
                } while (slice.length);
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.DeleteBuilder = DeleteBuilder;
