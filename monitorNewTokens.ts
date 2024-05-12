import { rayFee, solanaConnection } from './constants';
import { storeData } from './utils';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { u8, struct, NearUInt64 } from "@solana/buffer-layout"
import * as BL from "@solana/buffer-layout";
import { u64, publicKey } from "@solana/buffer-layout-utils"
import { MAINNET_PROGRAM_ID, TokenAmount, Token } from '@raydium-io/raydium-sdk';
import bs58 from 'bs58';
import * as spl from "@solana/spl-token"
import { getKeys } from "./getKeys";
import {buy} from "./buyToken";
//import {monitorPrice} from "./monitorPrice";
import { makeSwap } from "./swapTx2";

const dataPath = path.join(__dirname, 'data', 'new_solana_tokens.json');
const dataPath1 = path.join(__dirname, 'data', 'tokenPandL.json');
const monitoredTokenPrices = {};
//const initLog = struct([u8('logType'), u64('openTime'), u8('quoteDecimals'), u8('baseDecimals'), u64('quoteLotSize'), u64('baseLotSize'), u64('quoteAmount'), u64('baseAmount'), publicKey('market') ]);
let wallet: Keypair;
  const PRIVATE_KEY = "4J6nKo8pQvLDgPUPDVjvQT2UJsXMawQRys9hDfPaikHZfTAbGHyEJC1nvom4Ruu238i25SqXkFvadQo8UQMxPuJa";
  //const wallet = Keypair.fromSecretKey(Uint8Array.from([36,87,28,193,133,37,155,173,100,228,240,188,212,166,204,74,255,127,193,5,66,224,21,95,3,130,174,61,59,10,201,222,227,127,185,103,83,19,172,9,87,211,205,195,0,83,63,132,165,223,103,229,121,1,181,176,44,90,27,219,97,10,120,218]))

  wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
  console.log(`Wallet Address: ${wallet.publicKey}`);
  const ray = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
  const raydiumFees = new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5");
  //const newconnection = new Connection("wss://mainnet.helius-rpc.com/?api-key=c4f0d899-0b1c-48c5-8666-b059d34549b6")
  let mintAuth: any;
  let datainfo: any;
async function monitorNewTokens(connection: Connection) {
  
  /*
  const Owner = await solanaConnection.getParsedAccountInfo(new PublicKey('DZFRFRC83JgBY3fSvoGckNLCBGSYSAoB8peWYe7DUR6'),'processed');
  const totalSupply = 10000000000
   datainfo = Owner.value?.data;
   const owne = datainfo.parsed.info.owner;
   const ownedAmount = Number(datainfo.parsed.info.tokenAmount.uiAmount);
   const ownedPct = (ownedAmount/totalSupply)*100;
  console.log('Token Account Owner: '+owne+ ' amountOwned '+ownedAmount+' ownedPCT '+ownedPct);
  */
  console.log(chalk.green(`monitoring new solana tokens...`));

  try {
    connection.onLogs(
      rayFee,
      async (logObj) => {
        try {
          if (logObj.err) {
            console.error(`connection contains error, ${logObj.err}`);
            return;
          }
          let baseAddress = '';
          let baseDecimals = 0;
          let baseLpAmount = 0;
          let quoteAddress = '';
          let quoteDecimals = 0;
          let quoteLpAmount = 0;
          console.log(chalk.bgGreen(`found new token signature: ${logObj.signature} Time: ` +Date.now()));

          for (const log of logObj["logs"]) {
            if (log.includes("ray_log")) {
              const rayLogSplit = log.split(" ");
              console.log('log :'+rayLogSplit);
              const rayLog = rayLogSplit[rayLogSplit.length - 1].replace("'", "");
              console.log('log rayLog :'+rayLog);
              const logData = Buffer.from(rayLog, "base64");
              console.log('log LogDay:'+logData+'Time Now: '+Date.now());
              const parsedTransaction = await connection.getParsedTransaction(
                logObj.signature,
                {
                  maxSupportedTransactionVersion: 0,
                  commitment: 'confirmed',
                }
              );
              const market = new PublicKey(logData.subarray(43, 75));
              
              const postTokenBalances = parsedTransaction?.meta.postTokenBalances;

            const baseInfo = postTokenBalances?.find(
              (balance) =>
                balance.owner ===
                  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' &&
                balance.mint !== 'So11111111111111111111111111111111111111112'
            );

            if (baseInfo) {
              baseAddress = baseInfo.mint;
              baseDecimals = baseInfo.uiTokenAmount.decimals;
              baseLpAmount = baseInfo.uiTokenAmount.uiAmount;
            }

            const quoteInfo = postTokenBalances.find(
              (balance) =>
                balance.owner ==
                  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' &&
                balance.mint == 'So11111111111111111111111111111111111111112'
            );

            if (quoteInfo) {
              quoteAddress = quoteInfo.mint;
              quoteDecimals = quoteInfo.uiTokenAmount.decimals;
              quoteLpAmount = quoteInfo.uiTokenAmount.uiAmount;
            }
          
              //const { market, baseDecimals, quoteDecimals, openTime } = initLog.decode(Buffer.from(rayLog, "base64"));
              console.log('New Market'+market+'Time Now: '+Date.now());
              console.log('New baseDecimals'+baseDecimals+'Time Now: '+Date.now());
              console.log('New quoteDecimals'+quoteDecimals+'Time Now: '+Date.now());
              const keys = await getKeys(market, baseDecimals, quoteDecimals, solanaConnection, wallet);
              console.log('Keys '+keys.baseMint.toString()+' Time Now: '+Date.now());
              //console.log('Keys'+keys+'Time Now: '+Date.now());
              if(keys.baseMint.toString()!=='So11111111111111111111111111111111111111112'){
              await processToken(keys);
              }
              else{
                console.log(chalk.red('exiting cause SOL found as basemint '+keys.baseMint.toString()+' Time Now: '+Date.now()));
              }
              //wrapped sol and sol address So11111111111111111111111111111111111111112 check
            }
          }
          //store new tokens data in data folder
          await storeData(dataPath, logObj.logs);
        } catch (error) {
          const errorMessage = `error occured in new solana token log callback function, ${JSON.stringify(error, null, 2)}`;
          console.log(chalk.red(errorMessage));
          // Save error logs to a separate file
          fs.appendFile(
            'errorNewLpsLogs.txt',
            `${errorMessage}\n`,
            function (err) {
              if (err) console.log('error writing errorlogs.txt', err);
            }
          );
        }
      },
      'confirmed'
    );
  } catch (error) {
    const errorMessage = `error occured in new sol lp monitor, ${JSON.stringify(error, null, 2)}`;
    console.log(chalk.red(errorMessage));
    // Save error logs to a separate file
    fs.appendFile('errorNewLpsLogs.txt', `${errorMessage}\n`, function (err) {
      if (err) console.log('error writing errorlogs.txt', err);
    });
  }
}

async function processToken(keys){
  try {
  //mint authority - remove freezable if remounced = true then mint authority and freeze authority are null
  const accountData = await solanaConnection.getParsedAccountInfo(keys.baseMint,'processed');
  mintAuth = accountData.value?.data
  const mintAuthority = mintAuth.parsed.info.mintAuthority;
  const freezeAuthority = mintAuth.parsed.info.freezeAuthority;
  const totalSupply = String(mintAuth.parsed.info.supply);
  const decim = Number(mintAuth.parsed.info.decimals);
  const finalSupply = Number(totalSupply.slice(0,totalSupply.length-decim));
  /*const deserialize = spl.MintLayout.decode(accountData.data);
      const renounced =  deserialize.mintAuthorityOption === 0;
      const freezable =  deserialize.freezeAuthorityOption !== 0;*/
      
  console.log('renounced: '+mintAuthority+ ' freezable: '+freezeAuthority+' Time Now: '+Date.now());
  console.log('totalSupply: '+totalSupply+ ' finalSupply: '+finalSupply+' Time Now: '+Date.now());
  // pool size min should be 1
  const response = await solanaConnection.getTokenAccountBalance(keys.quoteVault, 'confirmed');
  const poolSize = new TokenAmount(Token.WSOL, response.value.amount, true);
  //await solanaConnection.getTokenSupply()
  //const poolSize1 = new TokenAmount(Token.WSOL, 2, false);
  console.log('quoteVault: '+keys.quoteVault.toString()+ ' poolSize: '+poolSize.toFixed()+ ' Time Now: '+Date.now());  
  //largest holder
  const largestHolders = await solanaConnection.getTokenLargestAccounts(keys.baseMint, "processed");
  //const totalSupply = await solanaConnection.getTokenSupply(keys.baseMint, "processed");
  //const lpMintSupply = await solanaConnection.getTokenSupply(keys.lpMint, "processed")
  console.log(' Top Holder address '+largestHolders.value[0].address.toString() )
  const Owner = await solanaConnection.getParsedAccountInfo(largestHolders.value[0].address,'processed');
  
   datainfo = Owner.value?.data;
   const owne = datainfo.parsed.info.owner;
   const ownedAmount = Number(datainfo.parsed.info.tokenAmount.uiAmount);
   const ownedPct = (ownedAmount/finalSupply)*100;
  console.log('Token Account Owner: '+owne+ ' amountOwned '+ownedAmount+' ownedPCT '+ownedPct);
  console.log(' Top Holder address '+largestHolders.value[0].address.toString() )
  if(owne === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'){
    const topOwnerRay = true;
  } else {const topOwnerRay=false;}
  if(mintAuthority === null && freezeAuthority === null && Number(poolSize.toFixed()) > 1 && owne === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' && ownedPct > 45 )
    {
      console.log('Mint address passed all checks ' +keys.baseMint.toString());
      
      let hasSwappedOut = false
      const mon = setInterval(async () => {
        console.log('baseVault '+keys.baseVault.toString()+' quoteVault '+keys.quoteVault.toString()+' OwnerBase'+keys.ownerBaseAta.toString());
        
        let monitorRes = await monitorPrice(keys, 100000);
        console.log(`${keys.baseMint.toString()}: ${monitorRes.swappedInAmount}, current lamports value: ${Number(monitorRes.currentLamports.toFixed(0))}, swap out?: ${monitorRes.swapOut}`)
        if (monitorRes.swapOut === true) {
          //SWAP OUT
          /*
          const swp = await makeSwap(Keys, monitorRes.swappedInAmount, 0, true)
          const sent = await connection.sendTransaction(swp, [wallet], {
            skipPreflight: false,
            preflightCommitment: "confirmed"
          })
          */
          console.log(`swapped out ${monitorRes.swappedInAmount} ${keys.baseMint.toString()} for ${Number(monitorRes.currentLamports.toFixed(0))} lamports,  closing monitor.`)
          hasSwappedOut = true
          clearInterval(mon)
        }
      }, 1000)
      
      //const sellToken = await monitorPrice(keys, 100000);
      /*
      console.log('Mint address passed all checks ' +keys.baseMint.toString());
      const buyLamports = 100000;
      const tx = await buy(keys, buyLamports, false, wallet); 
      if (tx.confirmed) {
        console.log(
          {
            mint: keys.baseMint.toString(),
            signature: tx.jitoTxsignature,
            url: `https://solscan.io/tx/${tx.jitoTxsignature}`,
          },
          ` Confirmed buy tx`,
        );
        //const tokenAmountIn = new TokenAmount(tokenIn, rawAccount.amount, true);
        for (let i = 0; i < 5; i++) {
        const sellToken = await monitorPrice(keys, buyLamports);
        //write if loop sellToken.sell === true 
        const selltx = await buy(keys, sellToken.swappedInAmount, true, wallet); 
        if (tx.confirmed) {
          console.log(
            {
              mint: keys.baseMint.toString(),
              signature: tx.jitoTxsignature,
              url: `https://solscan.io/tx/${tx.jitoTxsignature}`,
            },
            ` Confirmed sell tx`,
          );
          break;
        }
      }

        //const sellToken = await monitorPrice(keys, buyLamports);
      }
      */
      //console.log(tx);
      //const sent = await solanaConnection.sendTransaction(tx, [wallet]);
    }
    else{
      
      console.log('Mint address did Not pass all checks ' +keys.baseMint.toString());
      let hasSwappedOut = false
      const mon = setInterval(async () => {
        console.log('baseVault '+keys.baseVault.toString()+' quoteVault '+keys.quoteVault.toString()+' OwnerBase'+keys.ownerBaseAta.toString());
        let monitorRes = await monitorPrice(keys, 100000);
        console.log(`${keys.baseMint.toString()}: ${monitorRes.swappedInAmount}, current lamports value: ${Number(monitorRes.currentLamports.toFixed(0))}, swap out?: ${monitorRes.swapOut}`)
        if (monitorRes.swapOut === true) {
          //SWAP OUT
          /*
          const swp = await makeSwap(Keys, monitorRes.swappedInAmount, 0, true)
          const sent = await connection.sendTransaction(swp, [wallet], {
            skipPreflight: false,
            preflightCommitment: "confirmed"
          })
          */
          console.log(`swapped out ${monitorRes.swappedInAmount} ${keys.baseMint.toString()} for ${Number(monitorRes.currentLamports.toFixed(0))} lamports,  closing monitor.`)
          hasSwappedOut = true
          clearInterval(mon)
        }
      }, 1000)
      
      //const sellToken = await monitorPrice(keys, 100000);
      /*
      const tx = await buy(keys, 100000, false, wallet); 
      if (tx.confirmed) {
        console.log(
          {
            mint: keys.baseMint.toString(),
            signature: tx.jitoTxsignature,
            url: `https://solscan.io/tx/${tx.jitoTxsignature}`,
          },
          ` Confirmed buy tx`,
        );
        //const tokenAmountIn = new TokenAmount(tokenIn, rawAccount.amount, true);
        for (let i = 0; i < 5; i++) {
        const sellToken = await monitorPrice(keys, 100000);
        const selltx = await buy(keys, sellToken.swappedInAmount, true, wallet); 
        if (tx.confirmed) {
          console.log(
            {
              mint: keys.baseMint.toString(),
              signature: tx.jitoTxsignature,
              url: `https://solscan.io/tx/${tx.jitoTxsignature}`,
            },
            ` Confirmed sell tx`,
          );
          break;
        }
      }
        //const sellToken = await monitorPrice(keys, buyLamports);
      }
      */
      
      //console.log(tx);
    }
  }
  catch (error) {
    console.error(`Error in monitorPrice for ${keys.baseMint.toString()}: ${error}`);
  }
}

async function monitorPrice(poolKeys, USER_SETTINGS_LAMPORTS_IN) {
  const [baseVaultTotal, quoteVaultTotal, ownerVaultTotal] = await Promise.all([
    getUpdatedTokenAmount(poolKeys.baseVault),
    getUpdatedTokenAmount(poolKeys.quoteVault),
    getUpdatedTokenAmount(new PublicKey("AfrBZm8SU549gKzTN1NUNsqh2G6o8xumqJVAx4ZuqJpe")),
  ]);
  let swapOut = false
  
  const swapMath = Number(quoteVaultTotal.toString()) / Number(baseVaultTotal.toString());
  const currentValueSol = (Number(ownerVaultTotal) * swapMath) / Math.pow(10, 9);
  const currentValueLamports = Number(ownerVaultTotal) * swapMath
  const initialValueSol = Number(USER_SETTINGS_LAMPORTS_IN) / Math.pow(10, 9);
  if (currentValueSol >= initialValueSol * 1.2) { swapOut = true }
  return ({
    currentLamports: currentValueLamports,
    swappedInAmount: ownerVaultTotal,
    swapOut: swapOut
  })
}

async function getUpdatedTokenAmount(ata) {
  let accountInfo = null;
  console.log('ata current: '+ata.toString());
  while (accountInfo === null) {
    accountInfo = await solanaConnection.getParsedAccountInfo(ata, {
      commitment: "processed",
      dataSlice: {
        offset: 64,
        length: 8
      }
    });
    if (accountInfo === null) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  const balance = new BL.NearUInt64().decode(new Uint8Array((accountInfo).data.subarray(0, 8)));
  return balance;
}

/*
async function monitorPrice(tokenAddress) {
  try {
    const options = {
      method: 'GET',
      headers: {
        'X-API-KEY': 'd79f2be7b02f4fe5b862d1ebbc313d32' // Replace with your actual API key
      }
    };

    const response = await fetch(`https://public-api.birdeye.so/defi/price?address=${tokenAddress}`, options);

    if (!response.ok) {
      console.error(`Error fetching price for ${tokenAddress}` +response.json());
      return; // Handle error or retry logic
    }
    
    const priceData = await response.json();
    console.log(priceData);
    const initialPrice = priceData.data.value; // Assuming "price" property holds the price

    // Implement initial price storage (e.g., in-memory, local storage, database)
    storeInitialPrice(tokenAddress, initialPrice);

    // Set up an interval for price updates
    const intervalId = setInterval(async () => {
      try {
        const newResponse = await fetch(`https://public-api.birdeye.so/defi/price?address=${tokenAddress}`, options);
        if (!newResponse.ok) {
          console.error(`Error fetching price for ${tokenAddress}` +newResponse.json());
          return;
        }
        
        const newPriceData = await newResponse.json();
        console.log(`price for ${tokenAddress}` +newPriceData);
        const newPrice = newPriceData.data.value;

        console.log(`Current price of ${tokenAddress}: ${newPrice}`);

        // Price doubling check (optional)
        if (newPrice > initialPrice * 1.5) {
          console.log(`Price of ${tokenAddress} doubled! Current price: ${newPrice}`);
          // Implement additional actions for doubled price (e.g., notification)
          clearInterval(intervalId);
          console.log(chalk.bgBlue(`You Made a Profit ON : ${tokenAddress}`));
          const dataToWr = `You Made a Profit ON : ${tokenAddress}`;
          await storeData(dataPath1, dataToWr);
        }
        if (newPrice < initialPrice / 2) {
          console.log(`Price of ${tokenAddress} dropped significantly! Current price: ${newPrice}`);
          clearInterval(intervalId);
          console.log(chalk.bgRed(`You Made a Loss ON : ${tokenAddress}`));
          const dataToWr = `You Made a Loss ON : ${tokenAddress}`;
          await storeData(dataPath1, dataToWr);
          // Implement additional actions for significant price drop (e.g., notification)
        }
      } catch (error) {
        console.error(`Error in price update for ${tokenAddress}: ${error}`);
      }
    }, 5000); // Update price every 5 seconds (adjust as needed)

    // Handle cleanup when the program exits or monitoring is stopped
    return () => clearInterval(intervalId);
  } catch (error) {
    console.error(`Error in monitorPrice for ${tokenAddress}: ${error}`);
  }
}

function storeInitialPrice(tokenAddress, initialPrice) {
  monitoredTokenPrices[tokenAddress] = initialPrice;
  console.log(`Stored initial price for ${tokenAddress}: ${initialPrice}`);
}
*/



monitorNewTokens(solanaConnection);
