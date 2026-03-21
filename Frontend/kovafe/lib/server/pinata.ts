import { PinataSDK } from "pinata-web3";

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT, // ✅ was PINATA_API_KEY
  pinataGateway: "jade-obvious-goose-24.mypinata.cloud",
});