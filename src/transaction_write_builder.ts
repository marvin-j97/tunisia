import { TransactWriteItemList } from "aws-sdk/clients/dynamodb";

import Tunisia from "./index";
import { sliceGenerator } from "./slicer";

export class TransactionWriteBuilder {
  private $tunisia: Tunisia;

  constructor(root: Tunisia) {
    this.$tunisia = root;
  }

  async run(items: TransactWriteItemList): Promise<void> {
    const BATCH_SIZE = 25;

    for await (const slice of sliceGenerator(items, BATCH_SIZE)) {
      await this.$tunisia.getClient().transactWrite({ TransactItems: slice }).promise();
    }
  }
}
