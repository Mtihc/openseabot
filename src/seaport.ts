import { Network, OpenSeaPort } from "opensea-js";
import Web3 from "web3";
if (!process.env.OPENSEA_API_KEY) {
    throw new Error("Missing required environment variable OPENSEA_API_KEY");
}

const provider = new Web3.providers.HttpProvider("https://mainnet.infura.io");

export const seaport = new OpenSeaPort(provider, {
    apiKey: process.env.OPENSEA_API_KEY,
    networkName: Network.Main,
});

export default seaport;
