/*shadowystupidcoders dumb 120 line demo sniper */
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
const wallet = Keypair.fromSecretKey(bs58.decode(""));
const ray = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')

const TIP_ACCOUNTS = [
	'96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
	'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
	'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
	'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
	'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
	'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
	'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
	'3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
].map((pubkey) => new PublicKey(pubkey));
const getRandomTipAccount = () =>
	TIP_ACCOUNTS[Math.floor(Math.random() * TIP_ACCOUNTS.length)];
const tipLamports = 1000000;
const tip = SystemProgram.transfer({
	fromPubkey: wallet.publicKey,
	toPubkey: getRandomTipAccount(),
	lamports: BigInt(tipLamports.toString()),
});

export async function buy(keys, BuyLamports: Number, buysell: Boolean, wallet: Keypair): Promise<{ confirmed: boolean; jitoTxsignature?: string; error?: string }> {
	const confirmed = false
	const ahy = buysell;
	const tx = await makeSwap(keys, BuyLamports, 0, buysell, wallet);
	const latestBlockhash = await solanaConnection.getLatestBlockhash('finalized');
	const messageV02 = new TransactionMessage({
		payerKey: wallet.publicKey,
		recentBlockhash: latestBlockhash.blockhash,
		instructions: tx
	}).compileToV0Message();
	const swapTx = new VersionedTransaction(messageV02);
	swapTx.sign([wallet])

	console.log('wallet publicKey ' + wallet.publicKey.toString());
	const rand = await getRandomTipAccount()
	try {
		const jitTipTxFeeMessage = new TransactionMessage({
			payerKey: wallet.publicKey,
			recentBlockhash: latestBlockhash.blockhash,
			instructions: [
				SystemProgram.transfer({
					fromPubkey: wallet.publicKey,
					toPubkey: rand,
					lamports: 100000,
				}),
			],
		}).compileToV0Message();

		const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
		jitoFeeTx.sign([wallet]);
		const jitoTxsignature = bs58.encode(jitoFeeTx.signatures[0]);
		const serializedjitoFeeTx = bs58.encode(jitoFeeTx.serialize());
		const serializedTransaction = bs58.encode(swapTx.serialize());
		const serializedTransactions = [serializedjitoFeeTx, serializedTransaction];

		const endpoints = [
			'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
			'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
			'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
			'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
			'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
		];

		const requests = endpoints.map((url) =>
			axios.post(url, {
				jsonrpc: '2.0',
				id: 1,
				method: 'sendBundle',
				params: [serializedTransactions],
			}),
		);

		console.log('Sending transactions to endpoints...');
		const results = await Promise.all(requests.map((p) => p.catch((e) => e)));

		const successfulResults = results.filter((result) => !(result instanceof Error));

		if (successfulResults.length > 0) {
			console.log(`At least one successful response`);
			console.log(`Confirming jito transaction...`);
			//return await this.confirm(jitoTxsignature, latestBlockhash);
			const confirmation = await solanaConnection.confirmTransaction(
				{
				  signature: jitoTxsignature,
				  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
				  blockhash: latestBlockhash.blockhash,
				},
				'confirmed',
				
			  );
			  
			  return {confirmed: !confirmation.value.err, jitoTxsignature};

		} else {
			console.log(`No successful responses received for jito`);
		}

		return { confirmed: false };
	} catch (error) {
		if (error instanceof AxiosError) {
			console.log({ error: error.response?.data }, 'Failed to execute jito transaction');
		}
		console.log('Error during transaction execution', error);
		return { confirmed: false };
	}
	




	//const finalBundle = bs58.encode(swapTx.serialize());

	/*
	const bund = new JitoBundle([],3)
	const ok = bund.addTransactions(swapTx)
	const rand = await getRandomTipAccount()
	const tips = bund.addTipTx(wallet, 10000, rand, latestBlockhash.blockhash)
	console.log("Before Bundle")
	const sentBundle = await searcherClient.sendBundle(bund)
	console.log("bundle", sentBundle)
	console.log(`swapped in ${keys.baseMint.toString()}, monitoring...`)
	*/





	//return (confirmed)
}




