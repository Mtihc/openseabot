import "dotenv/config";
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
    occurred_after: lastTimestamp + 1,
  });
  if (asset_events.length === 0) {
    console.info("No new asset events to process.");
    return;
  }

  await messenger.sendAssetEventMessages(asset_events);

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
  const store = new FileStore(process.env.DATA_FILE_PATH || "data/data.json");
  const messenger = new Discord();
  await processAssetEvents(process.env.OPENSEA_COLLECTION_SLUG, store, messenger);
}

main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
