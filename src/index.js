import { Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import WebSocket from "ws";
import { Telegraf, Markup } from "telegraf";
import { formatNumber } from "./utils.js";
import { Config } from "./config.js";

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
const bot = new Telegraf(Config.BOT_API_TOKEN);
const ws = new WebSocket(Config.WEBSOCKET_CONNECTION);
const solanaConnection = new Connection(Config.RPC_CONNECTION, { wsEndpoint: Config.WEBSOCKET_CONNECTION });
const web3 = new Connection(Config.CONNECTION);
const metaplex = Metaplex.make(web3);

/*ws.onopen = () => {
  ws.send(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "logsSubscribe",

      params: [
        { mentions: [Config.PROGRAM_ID] },
        {
          commitment: "completed",
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


ws.onerror = function (evt) {
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
*/


const startEvent = () => {
  solanaConnection.onLogs(
    Config.PROGRAM_ID,
    async ({ logs, err, signature }) => {
      if (logs && logs.some(log => log.includes("initializeMint"))) {
        await getTokenMint(signature)
        console.log("initializeMint", signature)


      } else if (logs && logs.some(log => log.includes("InitializeMint"))) {
        await getTokenMint(signature)
        console.log("InitializeMint", signature)

      }
      else if (logs && logs.some(log => log.includes("InitializeMint2"))) {
        await getTokenMint(signature)
        console.log("InitializeMint2", signature)

      }
      else if (logs && logs.some(log => log.includes("initializeMint2"))) {
        await getTokenMint(signature)
        console.log("initializeMint2", signature)

      }
    },
    "confirmed"
  )
};


async function getTokenMint(signature) {
  await sleep(10000)
  try {
    const transaction = await web3.getParsedTransaction(
      signature,
      {
        maxSupportedTransactionVersion: 0,
      }
    );
    if (transaction && transaction.transaction) {
      transaction.transaction.message.instructions.forEach(async (instruction) => {
        // Further logic to verify if this instruction is a token creation
        if(instruction.parsed && instruction.parsed.type){
          if (instruction.parsed.type == "initializeMint") {
            await getTokenMeta(
              instruction.parsed.info.mint,signature
            );
          } else if (instruction.parsed.type == "InitializeMint") {
            await getTokenMeta(
              instruction.parsed.info.mint,signature
            );
          } else if (instruction.parsed.type == "initializeMint2") {
            await getTokenMeta(
              instruction.parsed.info.mint,signature
            );
          }
          else if (instruction.parsed.type == "InitializeMint2") {
            await getTokenMeta(
              instruction.parsed.info.mint,signature
            );
          }else{
            //console.log(instruction.parsed)
          }
        }
      });
    }

  } catch (err) {
    console.log('err', signature, err)
    await sleep(40000)
    await getTokenMint(signature);
    return
  }
}



async function getTokenSupply(mint) {
  let supply = await web3.getTokenSupply(mint);
  return supply.value.uiAmount;
}

async function getTokenMeta(mintAddress, signature) {
  console.log(mintAddress)
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
      .findByMint({ mintAddress: mint });

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
    supply = formatNumber(tokenSupply);
    if (token.mint.decimals === 0 ){
      console.log("Token decimals is 0, maybe nft??")
      return
    }
    

    let msg = `New  Mint » <a href="https://solscan.io/token/${mintAddress}">${name}</a>\n\n<code>${mint}</code>\n\n👉 ${supply} Minted\n\nOwner: <a href="https://solscan.io/account/${authority}">Deployer</a>\n\nChart: <a href="https://birdeye.so/token/${mint}">${name} (${symbol}) » Birdeye</a>`;
    const keyboards = [
      [
        Markup.button.url(
          "Trade on soltrader",
          `https://solscan.io/tx/${signature}`
        )
      ],
    ];
    if (logo) {
      await bot.telegram.sendPhoto(
        Config.TELEGRAM_CHAT_ID,
        logo,
        {
          caption: msg,
          parse_mode: "HTML",
          /*reply_markup: {
            inline_keyboard: keyboards,
          },*/
        }
      );
      return;
    }
    await bot.telegram.sendMessage(
      Config.TELEGRAM_CHAT_ID,
      msg,
      {
        parse_mode: "HTML",
        /*reply_markup: {
          inline_keyboard: keyboards,
        },*/
      }
    );
    return;
  } catch (e) {
    console.log("metaplex not fetching token", e);
    await sleep(20000);
    //await getTokenMeta(mintAddress);
  }
}

startEvent()