import { Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { Telegraf, Markup } from "telegraf";
import { formatNumber } from "./utils.js";
import { Config } from "./config.js";


const bot = new Telegraf(Config.BOT_API_TOKEN);
const solanaConnection = new Connection(Config.RPC_CONNECTION, { wsEndpoint: Config.WEBSOCKET_CONNECTION });


const startEvent = () => {
  console.log("Websocket Started Bruh")
  solanaConnection.onLogs(
    Config.PROGRAM_ID,
    ({ logs, err, signature }) => {
      if (logs && logs.some(log => log.includes("initializeMint"))) {
        let scanner = new TokenMintScanner(signature)
        scanner.getTokenMint()

      } else if (logs && logs.some(log => log.includes("InitializeMint"))) {
        //console.log('Mint',signature)
        let scanner = new TokenMintScanner(signature)
        scanner.getTokenMint()
      }
      else if (logs && logs.some(log => log.includes("InitializeMint2"))) {
        let scanner = new TokenMintScanner(signature)
        scanner.getTokenMint()

      }
      else if (logs && logs.some(log => log.includes("initializeMint2"))) {
        let scanner = new TokenMintScanner(signature)
        scanner.getTokenMint()

      }
    },
    'processed'
  )
};


class TokenMintScanner {
  constructor(signature) {
    this.signature = signature;
    this.RETRIES = 1;
    this.MAX_RETRIES = 5;
    this.connection = this.getConnection();
    this.metaplex = Metaplex.make(this.connection);
  }

  sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  getConnection() {
    //Ist Connection Instance
    if (this.RETRIES === 1) {
      return new Connection(Config.CONNECTION1)
    }
    //Second Connection Instance
    else if (this.RETRIES === 2) {
      return new Connection(Config.CONNECTION2)
    }
    //Third Connection Instance
    else if (this.RETRIES === 3) {
      return new Connection(Config.CONNECTION3)
    }
    //Fourth Connection Instance
    else if (this.RETRIES === 4) {
      return new Connection(Config.CONNECTION4)
    }
    //Last Connection Instance
    else {
      return new Connection(Config.CONNECTION5)
    }
  }

  async getTokenMint() {
    try {
      if (this.RETRIES >= this.MAX_RETRIES) {
        //we can't continue if rpc error
        return
      }
      await this.sleep(25000)
      const transaction = await this.connection.getParsedTransaction(
        this.signature,
        {
          maxSupportedTransactionVersion: 0,
        }
      );
      console.log(transaction)
      if (transaction && transaction.transaction) {
        transaction.transaction.message.instructions.forEach(instruction => {
          console.log(instruction)
          // logic to verify if this instruction is a token creation
          if (instruction.parsed && instruction.parsed.type) {
            if (instruction.parsed.type == "initializeMint") {
              this.getTokenMeta(
                instruction.parsed.info.mint
              );
            } else if (instruction.parsed.type == "InitializeMint") {
              this.getTokenMeta(
                instruction.parsed.info.mint
              );
            } else if (instruction.parsed.type == "initializeMint2") {
              this.getTokenMeta(
                instruction.parsed.info.mint
              );
            }
            else if (instruction.parsed.type == "InitializeMint2") {
              this.getTokenMeta(
                instruction.parsed.info.mint
              );
            }
          }
        });
      }

    } catch (err) {
      console.log("error", this.RETRIES,this.signature,err)
      //wait for 5secs
      await this.sleep(2000)
      // Increment tries
      this.RETRIES++;
      //retry mint 
      this.getTokenMint()
    }
  }


  
  async getTokenSupply(mint) {
    /**
     * @getTokenSupply
     * @param {PublicKey} mint: the token mint address
     * @returns {int} total token mint
     */
    const supply = await this.connection.getTokenSupply(mint);
    return supply.value.uiAmount;
  }
  

  async  getTokenMeta(mintAddress) {
    console.log(mintAddress)
    let mint = new PublicKey(mintAddress);
    let name;
    let symbol;
    let info;
    let supply;
    let logo;
    let authority;
  
    try {
      const token = await this.metaplex
        .nfts()
        .findByMint({ mintAddress: mint });
  
      name = token.json.name ? token.json.name : "";
      symbol = token.json.symbol ? token.json.symbol : "";
      info = token.json.description
        ? token.json.description
        : "";
      logo = token.json.image ? token.json.image : false;
      authority = token.updateAuthorityAddress.toString()
        ? token.updateAuthorityAddress
        : "";
      let tokenSupply = await this.getTokenSupply(mint);
      supply = formatNumber(tokenSupply);
      if (token.mint.decimals === 0) {
        //Token decimals is 0, maybe nft??
        return
      }
  
      let msg = `New  Mint » <a href="https://solscan.io/token/${mintAddress}">${name}</a>\n\n<code>${mint}</code>\n\n👉 ${supply} Minted\n\nOwner: <a href="https://solscan.io/account/${authority}">Deployer</a>\n\nChart: <a href="https://birdeye.so/token/${mint}">${name} (${symbol}) » Birdeye</a>\n\n${info}`;
      const keyboards = [
        [
          Markup.button.url(
            "solana explorer",
            `https://solscan.io/tx/${this.signature}`
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
      //you can keep running if you wish
      //await getTokenMeta(mintAddress);
    }
  }

}






startEvent()