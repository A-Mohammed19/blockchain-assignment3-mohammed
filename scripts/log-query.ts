import { createPublicClient, http } from 'viem';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const {
  RPC_URL,
  CHAIN_ID,
  TOKEN_ADDRESS,
} = process.env;

if (!RPC_URL || !CHAIN_ID || !TOKEN_ADDRESS) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const chain = {
  id: Number(CHAIN_ID),
  name: `Custom Chain ${CHAIN_ID}`,
  network: 'customnet',
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
  testnet: false,
};

const artifactPath = path.resolve('./artifacts/contracts/CampusCredit.sol/MyToken.json');

const main = async () => {
  const CampusCredit = JSON.parse(await fs.readFile(artifactPath, 'utf8'));

  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });

  const contractAddress = TOKEN_ADDRESS as `0x${string}`;
  const abi = CampusCredit.abi;

  // Get the latest block number
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock = latestBlock > 2000n ? latestBlock - 2000n : 0n;

  // Find event definitions from ABI
  const transferEvent = abi.find((item: any) => item.type === 'event' && item.name === 'Transfer');
  const approvalEvent = abi.find((item: any) => item.type === 'event' && item.name === 'Approval');

  if (!transferEvent || !approvalEvent) {
    console.error('❌ Events not found in ABI.');
    process.exit(1);
  }

  console.log('\n📦 Transfer Events (last ~2000 blocks):');
  const transferLogs = await publicClient.getLogs({
    address: contractAddress,
    event: transferEvent,  // pass the ABI event object here
    fromBlock,
    toBlock: 'latest',
  });

  for (const log of transferLogs) {
    const args = (log as any).args;
    console.log(`Block: ${log.blockNumber} | Tx: ${log.transactionHash}`);
    console.log(`→ From: ${args.from}`);
    console.log(`→ To:   ${args.to}`);
    console.log(`→ Value: ${args.value.toString()}`);
    console.log('-------------------------');
  }

  console.log('\n✅ Approval Events (last ~2000 blocks):');
  const approvalLogs = await publicClient.getLogs({
    address: contractAddress,
    event: approvalEvent,  // pass the ABI event object here
    fromBlock,
    toBlock: 'latest',
  });

  for (const log of approvalLogs) {
    const args = (log as any).args;
    console.log(`Block: ${log.blockNumber} | Tx: ${log.transactionHash}`);
    console.log(`→ Owner:   ${args.owner}`);
    console.log(`→ Spender: ${args.spender}`);
    console.log(`→ Value:   ${args.value.toString()}`);
    console.log('-------------------------');
  }
};

main().catch((err) => {
  console.error('❌ Error reading logs:', err);
  process.exit(1);
});
