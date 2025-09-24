import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
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
  ...hardhat,
  id: Number(CHAIN_ID),
};

const artifactPath = path.resolve('./artifacts/contracts/CampusCredit.sol/MyToken.json');
const CampusCredit = JSON.parse(await fs.readFile(artifactPath, 'utf8'));

const recipient = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Update as needed

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

  const amount = 1n * 10n ** 18n;

  const printBalances = async () => {
    const deployerBalance = await publicClient.readContract({
      ...contract,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const recipientBalance = await publicClient.readContract({
      ...contract,
      functionName: 'balanceOf',
      args: [recipient],
    });

    console.log(`📊 Deployer Balance:  ${deployerBalance}`);
    console.log(`📥 Recipient Balance: ${recipientBalance}`);
  };

  console.log('\n🔎 Balances BEFORE transfer & approve:');
  await printBalances();

  // ➤ Transfer
  console.log('\n🚀 Sending transfer...');
  const transferTxHash = await wallet.writeContract({
    ...contract,
    functionName: 'transfer',
    args: [recipient, amount],
    gas: 100_000n,
  });

  const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTxHash });
  console.log('✅ Transfer confirmed!');
  console.log('Tx Hash:       ', transferTxHash);
  console.log('Block Number:  ', transferReceipt.blockNumber);
  console.log('Gas Used:      ', transferReceipt.gasUsed.toString());

  console.log('\n🔎 Balances AFTER transfer:');
  await printBalances();


  console.log('\n🛂 Sending approve...');
  const approveTxHash = await wallet.writeContract({
    ...contract,
    functionName: 'approve',
    args: [recipient, amount],
    gas: 100_000n,
  });

  const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  console.log('✅ Approve confirmed!');
  console.log('Tx Hash:       ', approveTxHash);
  console.log('Block Number:  ', approveReceipt.blockNumber);
  console.log('Gas Used:      ', approveReceipt.gasUsed.toString());

  const allowance = await publicClient.readContract({
    ...contract,
    functionName: 'allowance',
    args: [account.address, recipient],
  });

  console.log(`\n🧾 Allowance after approve: ${allowance}`);
};

main().catch((e) => {
  console.error('❌ Error in transfer-approve script:', e);
  process.exit(1);
});
