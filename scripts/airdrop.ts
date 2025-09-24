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
  TOKEN_ADDRESS,
} = process.env;

if (!RPC_URL || !PRIVATE_KEY || !CHAIN_ID || !TOKEN_ADDRESS) {
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
const CampusCredit = JSON.parse(await fs.readFile(artifactPath, 'utf8'));

const recipients = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
];

const amounts = [
  100n * 10n ** 18n,
  50n * 10n ** 18n,
  25n * 10n ** 18n,
];

const main = async () => {
  const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
  const account = privateKeyToAccount(key as `0x${string}`);

  const wallet = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });

  const contract = {
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: CampusCredit.abi,
  };

  if (recipients.length !== amounts.length) {
    console.error('❌ Recipients and amounts length mismatch.');
    process.exit(1);
  }

  // 1. BATCH AIRDROP
  console.log('\n🚀 Sending BATCH airdrop transaction...');
  const batchTxHash = await wallet.writeContract({
    ...contract,
    functionName: 'airdrop',
    args: [recipients, amounts],
    gas: 500_000n,
  });

  const batchReceipt = await publicClient.waitForTransactionReceipt({ hash: batchTxHash });

  console.log('✅ BATCH Airdrop Success!');
  console.log('Tx Hash:     ', batchTxHash);
  console.log('Block:       ', batchReceipt.blockNumber);
  console.log('Gas Used:    ', batchReceipt.gasUsed.toString());

  // 2. SINGLE TRANSFERS (for comparison)
  console.log('\n🔁 Sending individual transfers for gas comparison...');
  let totalGasUsed = 0n;

  for (let i = 0; i < recipients.length; i++) {
    const txHash = await wallet.writeContract({
      ...contract,
      functionName: 'transfer',
      args: [recipients[i], amounts[i]],
      gas: 100_000n,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`Transfer to ${recipients[i]} confirmed.`);
    console.log(`→ Tx Hash:  ${txHash}`);
    console.log(`→ Gas Used: ${receipt.gasUsed.toString()}`);

    totalGasUsed += receipt.gasUsed;
  }

  const batchGasUsed = batchReceipt.gasUsed;
  const gasSavedPercent = ((Number(totalGasUsed - batchGasUsed) / Number(totalGasUsed)) * 100).toFixed(2);

  console.log('\n📊 GAS COMPARISON');
  console.log(`Batch airdrop gas:       ${batchGasUsed}`);
  console.log(`Total single transfers:  ${totalGasUsed}`);
  console.log(`Gas saved by batch:      ${gasSavedPercent}%`);
};

main().catch((err) => {
  console.error('❌ Error in airdrop script:', err);
  process.exit(1);
});
