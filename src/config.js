import {PublicKey, clusterApiUrl} from "@solana/web3.js";
import 'dotenv/config.js';


export const  Config = {
    PROGRAM_ID: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    CONNECTION1: process.env.HTTP_ENDPOINT1,
    CONNECTION2: process.env.HTTP_ENDPOINT2,
    CONNECTION3: process.env.HTTP_ENDPOINT3,
    CONNECTION4: process.env.HTTP_ENDPOINT4,
    CONNECTION5: process.env.HTTP_ENDPOINT5,
    RPC_CONNECTION: clusterApiUrl('mainnet-beta'),
    WEBSOCKET_CONNECTION: "wss://api.mainnet-beta.solana.com" ,
    BOT_API_TOKEN: process.env.BOT_API_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
}
