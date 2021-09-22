import { TransactWriteItemList } from "aws-sdk/clients/dynamodb";
import { sliceGenerator } from "slicer";
import Tunisia from "./index";

export class TransactionWriteBuilder {
  private $tunisia: Tunisia;

  constructor(root: Tunisia) {
    this.$tunisia = root;
  }

  async run(items: TransactWriteItemList) {
    const BATCH_SIZE = 25;

    for await (const slice of sliceGenerator(items, BATCH_SIZE)) {
      await this.$tunisia.getClient().transactWrite({ TransactItems: slice }).promise();
    }
  }
}
