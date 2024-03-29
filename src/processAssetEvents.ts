import "dotenv/config";
import path from "path";
import * as moment from "moment";
import Discord from "./messengers/Discord";
import IMessenger from "./messengers/IMessenger";
import seaport from "./seaport";
import FileStore from "./stores/FileStore";
import IStore from "./stores/IStore";

async function processAssetEvents(collectionSlug: string, store: IStore, messenger: IMessenger): Promise<void> {
  let lastTimestamp = store.getLastAssetEventTransactionTimestamp();
  const {asset_events} = await seaport.api.get("/api/v1/events", {
    collection_slug: collectionSlug,
    offset: 0,
    limit: 100,
    only_opensea: false,
    occurred_after: lastTimestamp ? lastTimestamp + 1 : undefined,
  });
  if (asset_events.length === 0) {
    console.info("No new asset events to process.");
    return;
  }

  if (!!lastTimestamp) {
    await messenger.sendAssetEventMessages(asset_events);
  }

  if (asset_events[0].transaction?.timestamp) {
    lastTimestamp = moment.utc(asset_events[0].transaction?.timestamp).unix();
  } else {
    lastTimestamp = moment.utc().unix();
  }
  store.setLastAssetEventTransactionTimestamp(lastTimestamp);
}

async function main(): Promise<void> {
  if (!process.env.OPENSEA_COLLECTION_SLUG) {
    throw new Error(`Missing required environment variable OPENSEA_COLLECTION_SLUG`);
  }
  await processAssetEvents(
      process.env.OPENSEA_COLLECTION_SLUG,
      new FileStore(path.join(process.env.DATA_DIR || "data", "data.json")),
      new Discord()
  );
}

main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
