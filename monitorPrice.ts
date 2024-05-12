import { PublicKey, Keypair, Connection, ComputeBudgetProgram, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { u8, struct, NearUInt64 } from "@solana/buffer-layout"
import { u64, publicKey } from "@solana/buffer-layout-utils"
import * as spl from "@solana/spl-token"
import BN from 'bn.js'
import { getKeys } from "./getKeys";
import bs58 from 'bs58';
import { makeSwap } from "./swapTx2";
import { solanaConnection } from './constants';
import { Bundle, Bundle as JitoBundle } from 'jito-ts/dist/sdk/block-engine/types.js';
import { searcherClient } from './jito';
import axios, { AxiosError } from 'axios';
import * as BL from "@solana/buffer-layout";
import chalk from 'chalk';
import { storeData } from './utils';
import path from 'path';
import { Liquidity, LiquidityPoolKeysV4, LiquidityStateV4, Percent, Token, TokenAmount, poolKeys2JsonInfo } from '@raydium-io/raydium-sdk';

//const wallet = Keypair.fromSecretKey(bs58.decode("4J6nKo8pQvLDgPUPDVjvQT2UJsXMawQRys9hDfPaikHZfTAbGHyEJC1nvom4Ruu238i25SqXkFvadQo8UQMxPuJa"));
const ray = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
const monitoredTokenPrices = {};
const dataPath = path.join(__dirname, 'data', 'tokenPandL.json');


  export async function monitorPrice(keys, buyLamports: Number){
    //const ownerVaultTotal = await getUpdatedTokenAmount(keys.ownerBaseAta)
    const poolInfo = await Liquidity.fetchInfo({
        connection: solanaConnection,
        poolKeys: keys,
      });
    console.log('PoolInfo '+poolInfo.lpSupply);

     
    return { sell: false, swappedInAmount: 0 };
}



/*
async function getUpdatedTokenAmount(ata) {
    let accountInfo = null;
    while (accountInfo === null) {
      accountInfo = await solanaConnection.getAccountInfo(ata, {
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
  */