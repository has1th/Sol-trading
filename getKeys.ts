/*shadowystupidcoders dumb 120 line demo sniper */
import { PublicKey, Keypair, Connection, ComputeBudgetProgram, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { u8, struct, NearUInt64 } from "@solana/buffer-layout"
import { u64, publicKey } from "@solana/buffer-layout-utils"
import * as spl from "@solana/spl-token"
import BN from 'bn.js'
import bs58 from 'bs58';
//const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=c4f0d899-0b1c-48c5-8666-b059d34549b6")
//const wallet = Keypair.fromSecretKey(bs58.decode(""));
const ray = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
export async function getKeys(marketId, baseDecimals, quoteDecimals, connection: Connection, wallet: Keypair) {
    console.log('In GetKeysss'+marketId+'Time Now: '+Date.now());
    const getAta = async (mint, publicKey) => PublicKey.findProgramAddressSync([publicKey.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];
  async function getMarketInfo(marketId) {
    //console.log('In GetKeys marketInfo '+marketId+'Time Now: '+Date.now());
  const info = await connection.getAccountInfo(marketId);
  const markettInfo = spl.MintLayout.decode(info.data);
  const markk = info.owner.toString();
  //console.log('In GetKeys markkInfo '+marketId+'Time Now: '+Date.now());
  const ownAddress = new PublicKey(info.data.slice(13, 45))
  const vaultSignerNonce = new NearUInt64().decode(new Uint8Array((info).data.subarray(45, 53)))
  const baseMint = new PublicKey(info.data.slice(53, 85))
  const quoteMint = new PublicKey(info.data.slice(85, 117))
  const bids = new PublicKey(info.data.slice(285, 317))
  const asks = new PublicKey(info.data.slice(317, 349))
  const event = new PublicKey(info.data.slice(253, 285))
  const baseVault = new PublicKey(info.data.slice(117, 149))
  const quoteVault = new PublicKey(info.data.slice(165, 197))
  const marketInfo = {
  ownAddress,
  vaultSignerNonce,
  baseMint,
  quoteMint,
  bids,
  asks,
  event,
  baseVault,
  quoteVault}
  return(marketInfo)
  }
  const marketInfo = await getMarketInfo(marketId)
  //console.log('In GetKeys after marketInfo '+marketId+'Time Now: '+Date.now());
  const [baseMint, quoteMint] = [marketInfo.baseMint, marketInfo.quoteMint];
  const [ownerBaseAta, ownerQuoteAta] = await Promise.all([getAta(baseMint, wallet.publicKey), getAta(quoteMint, wallet.publicKey)]);
  const authority = PublicKey.findProgramAddressSync([Buffer.from([97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121])], ray)[0];
  //console.log('In GetKeys after authority '+marketId+'Time Now: '+Date.now());
  const marketAuthority = PublicKey.createProgramAddressSync([marketId.toBuffer(), Buffer.from([Number(marketInfo.vaultSignerNonce.toString())]), Buffer.alloc(7)], new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'));
  //console.log('In GetKeys after marketAuth '+marketId+'Time Now: '+Date.now());
  const seeds = ['amm_associated_seed', 'coin_vault_associated_seed', 'pc_vault_associated_seed', 'lp_mint_associated_seed', 'temp_lp_token_associated_seed', 'target_associated_seed', 'withdraw_associated_seed', 'open_order_associated_seed', 'pc_vault_associated_seed'].map(seed => Buffer.from(seed, 'utf-8'));
  //console.log('In GetKeys after seeds'+marketId+'Time Now: '+Date.now());
  const [id, baseVault, coinVault, lpMint, lpVault, targetOrders, withdrawQueue, openOrders, quoteVault] = await Promise.all(seeds.map(seed => PublicKey.findProgramAddress([ray.toBuffer(), marketId.toBuffer(), seed], ray)));
  //console.log('In GetKeys after all'+marketId+'Time Now: '+Date.now());
  return({
    programId: ray,
    baseMint,
    quoteMint,
    ownerBaseAta,
    ownerQuoteAta,
    baseDecimals,
    quoteDecimals,
    tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    lpDecimals: baseDecimals,
    authority,
    marketAuthority,
    marketProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
    marketId,
    marketBids: marketInfo.bids,
    marketAsks: marketInfo.asks,
    marketQuoteVault: marketInfo.quoteVault,
    marketBaseVault: marketInfo.baseVault,
    marketEventQueue: marketInfo.event,
    id: id[0],
    baseVault: baseVault[0],
    coinVault: coinVault[0],
    lpMint: lpMint[0],
    lpVault: lpVault[0],
    targetOrders: targetOrders[0],
    withdrawQueue: withdrawQueue[0],
    openOrders: openOrders[0],
    quoteVault: quoteVault[0],
    lookupTableAccount: PublicKey.default,
    wallet: wallet.publicKey})}