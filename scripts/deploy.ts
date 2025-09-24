import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const {
  RPC_URL,
  PRIVATE_KEY,
  CHAIN_ID,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_CAP,
  TOKEN_INITIAL,
} = process.env;

if (!RPC_URL || !PRIVATE_KEY || !CHAIN_ID || !TOKEN_NAME || !TOKEN_SYMBOL || !TOKEN_CAP || !TOKEN_INITIAL) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const artifactPath = path.resolve('./artifacts/contracts/CampusCredit.sol/MyToken.json');
const CampusCredit = JSON.parse(await fs.readFile(artifactPath, 'utf8'));

const didlabChain = {
  id: Number(CHAIN_ID),
  name: `DIDLab Team ${CHAIN_ID}`,
  network: 'didlab',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
  blockExplorers: undefined,
  testnet: false,
};

const main = async () => {
   const key = (PRIVATE_KEY as string).startsWith('0x') 
  ? (PRIVATE_KEY as `0x${string}`) 
  : (`0x${PRIVATE_KEY}` as `0x${string}`);

const account = privateKeyToAccount(key);




  const wallet = createWalletClient({
    account,
    chain: didlabChain,
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: didlabChain,
    transport: http(RPC_URL),
  });

  const cap = BigInt(TOKEN_CAP) * 10n ** 18n;
  const initial = BigInt(TOKEN_INITIAL) * 10n ** 18n;

  const hash = await wallet.deployContract({
    abi: CampusCredit.abi,
    bytecode: CampusCredit.bytecode,
    args: [TOKEN_NAME, TOKEN_SYMBOL, cap, account.address, initial],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log('✅ Deploy successful!');
  console.log('Tx Hash:', hash);
  console.log('Contract Address:', receipt.contractAddress);
  console.log('Block:', receipt.blockNumber);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
