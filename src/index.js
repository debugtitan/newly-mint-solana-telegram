import {Connection, PublicKey} from "@solana/web3.js";
import {Metaplex} from "@metaplex-foundation/js";
import WebSocket from "ws";
import {Telegraf, Markup} from "telegraf";
import {formatNumber} from "./utils.js";
import {Config} from "./config.js";

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
const bot = new Telegraf(Config.BOT_API_TOKEN);
const ws = new WebSocket(Config.WEBSOCKET_CONNECTION);
const web3 = new Connection(Config.CONNECTION);
const metaplex = Metaplex.make(web3);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "logsSubscribe",

      params: [
        {mentions: [Config.PROGRAM_ID]},
        {
          commitment: "processed",
          maxSupportedTransactionVersion: 0,
          encoding: "jsonParsed",
        },
      ],
    })
  );
};

ws.on("message", evt => {
  try {
    const buffer = evt.toString("utf8");
    parseLogs(JSON.parse(buffer));
    return;
  } catch (e) {
    //console.log(e);
  }
});


ws.onerror = function(evt){
  console.log('web socket unexpectedly closed')
}


function parseLogs(buffer) {
  if (buffer.params === undefined) {
    return;
  }
  const logs = buffer.params.result.value.logs;
  for (const log of logs) {
    if (
      log.includes("InitializeMint") ||
      log.includes("InitializeMint2") ||
      log.includes("initializeMint2") ||
      log.includes("initializeMint")
    ) {
      getTokenMint(buffer.params.result.value.signature);
    }
  }
}


async function getTokenMint(signature) {
  try {
    const transaction = await web3.getParsedTransaction(
      signature,
      {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      }
    );

    if (transaction && transaction.transaction) {
      transaction.transaction.message.instructions.forEach(
        async instruction => {
              
          if(instruction.parsed && instruction.parsed.type){
            if(instruction.parsed.type == 'InitializeMint' || instruction.parsed.type == 'InitializeMint2' ||instruction.parsed.type == 'initializeMint' ||instruction.parsed.type == 'initializeMint2'){
              console.log(instruction.parsed,signature)
              await getTokenMeta(instruction.parsed.info.mint)
            }
            
          }else{
            console.log(instruction)
          }
        }
      );
    }
    
  } catch (err) {
    console.log(err, "SOLANA JSON RPC ERROR");
    await getTokenMint(signature);
    return;
  }
}

async function getTokenSupply(mint) {
  let supply = await web3.getTokenSupply(mint);
  return supply.value.uiAmount;
}

async function getTokenMeta(mintAddress, signature) {
  let mint = new PublicKey(mintAddress);
  let name;
  let symbol;
  let info;
  let supply;
  let logo;
  let decimals;
  let authority;

  try {
    const token = await metaplex
      .nfts()
      .findByMint({mintAddress: mint});

    name = token.json.name ? token.json.name : "";
    symbol = token.json.symbol ? token.json.symbol : "";
    info = token.json.description
      ? token.json.description
      : "";
    logo = token.json.image ? token.json.image : false;
    decimals = token.mint.decimals
      ? token.mint.decimals
      : "NOT SPECIFIED";
    authority = token.updateAuthorityAddress.toString()
      ? token.updateAuthorityAddress
      : undefined;
    let tokenSupply = await getTokenSupply(mint);
    if (tokenSupply < 1000) {
      return;
    } else {
      supply = formatNumber(tokenSupply);
    }

    let msg = `🌚 New Token Mint\n\n<b>«« ${name}   (${symbol})  »»</b>\n\n👉 <b>${supply}</b> Minted\n\nOwner: <code>${authority}</code>\n\n${info}\n\n🆕 <code>${mint}</code>`;
    const keyboards = [
      [
        Markup.button.url(
          "solscan",
          `https://solscan.io/tx/${signature}`
        ),
        Markup.button.url(
          `❤️ Token`,
          `https://solscan.io/token/${mint.toString()}`
        ),
      ],
    ];
    if (logo) {
      await bot.telegram.sendPhoto(
        Config.TELEGRAM_CHAT_ID,
        logo,
        {
          caption: msg,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: keyboards,
          },
        }
      );
      return;
    }
    await bot.telegram.sendMessage(
      Config.TELEGRAM_CHAT_ID,
      msg,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboards,
        },
      }
    );
    return;
  } catch (e) {
    console.log("metaplex not fetching token", e);
    await sleep(20000);
    await getTokenMeta(mintAddress);
  }
}

