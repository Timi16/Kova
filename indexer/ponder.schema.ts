import { onchainTable } from "@ponder/core";

export const syncState = onchainTable("sync_state", (t) => ({
  id: t.text().primaryKey(),
}));
