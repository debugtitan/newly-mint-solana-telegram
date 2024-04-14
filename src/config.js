import {PublicKey} from "@solana/web3.js";
import 'dotenv/config.js';
const  HTTP_ENDPOINT= process.env.HTTP_ENDPOINT
const WSS_ENDPOINT= process.env.WSS_ENDPOINT || "wss://api.mainnet-beta.solana.com" 

export const  Config = {
    PROGRAM_ID: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    CONNECTION: HTTP_ENDPOINT,
    WEBSOCKET_CONNECTION: WSS_ENDPOINT,
    BOT_API_TOKEN: process.env.BOT_API_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
}
