import { Keypair } from '@solana/web3.js';
import { config } from './config';
import { SearcherClient, searcherClient as jitoSearcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import * as fs from 'fs';

const BLOCK_ENGINE_URLS = config.get('block_engine_urls');
const AUTH_KEYPAIR_PATH = config.get('auth_keypair_path');

const decodedKey = new Uint8Array(JSON.parse(fs.readFileSync(AUTH_KEYPAIR_PATH).toString()) as number[])
const keypair = Keypair.fromSecretKey(decodedKey);
const searcherClients: SearcherClient[] = [];
for (const url of BLOCK_ENGINE_URLS) {
const client = jitoSearcherClient(url, keypair);
searcherClients.push(client);
}

const searcherClient = searcherClients[0];

export { searcherClient, searcherClients};
