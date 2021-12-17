import {Client, EmbedFieldData, Intents, MessageEmbed} from "discord.js";
import IMessenger from "./IMessenger";
if (!process.env.DISCORD_BOT_TOKEN) { throw new Error("Missing required environment variable DISCORD_BOT_TOKEN"); }
if (!process.env.DISCORD_CHANNEL_ID) { throw new Error("Missing required environment variable DISCORD_CHANNEL_ID"); }

class Discord implements IMessenger {
  private client: Client;

  constructor() {
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });
  }

  public async sendAssetEventMessages(assetEvents: any[]): Promise<void[]> {
    const messages = assetEvents.reverse().map((assetEvent) => {
      return this.getAssetEventMessageEmbed(assetEvent);
    }).filter((message) => message !== undefined);
    return this.sendMessages(messages);
  }

  private async channel(channelId: string): Promise<any> {
    const id = channelId;
    return new Promise((resolve) => {
      this.client.login(process.env.DISCORD_BOT_TOKEN);
      this.client.on("ready", async () => {
        const channel = await this.client.channels.fetch(id);
        resolve(channel);
      });
    });
  }

  private async sendMessages(messages: MessageEmbed[]): Promise<void[]> {
    const channelIds = process.env.DISCORD_CHANNEL_ID.split(";");

    console.log(`Sending ${messages.length} messages to ${channelIds.length} Discord channels.`);

    if (process.env.DEBUG_MESSAGING === "true" || process.env.DEBUG_MESSAGING === "1") {
      console.log("Messages:", JSON.stringify(messages));
      return Promise.resolve([]);
    }

    return await Promise.all(
        channelIds.map(async (channelId) => {
          const channel = await this.channel(channelId);
          console.log(`Sending ${messages.length} messages to Discord channel: #${channel.name}.`);

          await Promise.all(messages.map(async (message) => {
            await channel.send({ embeds: [message] });
          }));
          console.log(`All ${messages.length} messages were sent to Discord channel: #${channel.name}`);
        }),
    );
  }

  private getAssetEventMessageEmbed(assetEvent: any): MessageEmbed {

    function withDefaults(message: MessageEmbed): MessageEmbed {
      return message
          .setURL(assetEvent.asset?.permalink)
          .setAuthor("OpenSeaBot", assetEvent.asset?.collection.image_url)
          .setThumbnail(assetEvent.asset?.image_thumbnail_url)
          .setTimestamp(Date.parse(`${assetEvent.created_date }Z`));
    }

    function accountField(name: string, account: any): EmbedFieldData {
      return {
        name,
        value: `[${account.user?.username || account.address.substring(2, 8).toUpperCase()}](https://opensea.io/${account.address})`,
        inline: true,
      } as EmbedFieldData;
    }

    function* priceFields(price: string, symbol: string, usdPrice: string): Iterable<EmbedFieldData> {
      const pow8 = Math.pow(10, 8);
      const totalPriceEth = Math.round((parseFloat(price || "0") / Math.pow(10, 18)) * pow8) / pow8;
      const totalPriceUsd = (totalPriceEth * parseFloat(usdPrice || "0"));
      yield ({name: `Price ${symbol}`, value: totalPriceEth.toString(), inline: true} as EmbedFieldData);
      yield ({name: "Price USD", value: totalPriceUsd.toFixed(2), inline: true} as EmbedFieldData);
    }

    switch (assetEvent.event_type) {
      case "successful":
        return withDefaults(new MessageEmbed()
            .setColor("#0099ff")
            .setTitle(`Sale: ${assetEvent.asset?.name || "Unnamed NFT"}`)
            .addFields(
                {name: "NFTs", value: assetEvent.quantity, inline: true},
                ...Array.from(priceFields(
                    assetEvent.total_price,
                    assetEvent.payment_token.symbol,
                    assetEvent.payment_token.usd_price,
                )),
                accountField("Seller", assetEvent.seller),
                accountField("Buyer", assetEvent.winner_account),
            ));
      case "created":
        return withDefaults(new MessageEmbed()
            .setColor("#4caf50")
            .setTitle(`New listing: ${assetEvent.asset?.name || "Unnamed NFT"}`)
            .addFields(
                {name: "NFTs", value: assetEvent.quantity.toString(), inline: true},
                ...Array.from(priceFields(
                    assetEvent.starting_price,
                    assetEvent.payment_token.symbol,
                    assetEvent.payment_token.usd_price,
                )),
                accountField("Seller", assetEvent.seller),
            ));
      case "transfer":
        if (assetEvent.to_account.address === "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b") {
          // skip these mysterious transfers to OpenSea-Orders that come after every sale
          return undefined;
        }
        if (assetEvent.from_account.address === "0x0000000000000000000000000000000000000000") {
          return withDefaults(new MessageEmbed()
              .setColor("#ff9800")
              .setTitle(`Minted: ${assetEvent.asset?.name || "Unnamed NFT"}`)
              .addFields(
                  {name: "NFTs", value: assetEvent.quantity, inline: true},
                  accountField("To", assetEvent.to_account),
              ));
        } else {
          return withDefaults(new MessageEmbed()
              .setColor("#505050")
              .setTitle(`Transfer: ${assetEvent.asset?.name || "Unnamed NFT"}`)
              .addFields(
                  {name: "NFTs", value: assetEvent.quantity, inline: true},
                  accountField("From", assetEvent.transaction.from_account),
                  accountField("To", assetEvent.transaction.to_account),
              ));
        }
      case "offer_entered":
        return withDefaults(new MessageEmbed()
            .setColor("#505050")
            .setTitle(`Price Offered: ${assetEvent.asset?.name || "Unnamed NFT"}`)
            .addFields(
                accountField("From", assetEvent.from_account),
                ...Array.from(priceFields(
                    assetEvent.bid_amount,
                    assetEvent.payment_token.symbol,
                    assetEvent.payment_token.usd_price,
                )),
                accountField("Owner", assetEvent.asset?.owner)
            ))
      default:
        console.warn(JSON.stringify(assetEvent, null, 2));
        console.warn(`Unhandled asset event type "${assetEvent.event_type}"`);
        return undefined;
    }
  }
}

export default Discord;
