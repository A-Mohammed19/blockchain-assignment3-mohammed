## a. Contract Features Enforced

- **Cap:**  
  The token contract implements a maximum supply cap to restrict minting beyond a fixed limit. This ensures token scarcity and controlled inflation.

- **Pause:**  
  The contract includes pausing functionality, allowing the owner or authorized roles to pause transfers and approvals temporarily for security or administrative reasons.

- **Roles:**  
  Role-based access control is implemented to manage permissions for minting, pausing, and other sensitive operations, enhancing contract security.

---

## b. Gas Efficiency: Batch Airdrop vs Single Transfers

- The batch airdrop uses a single transaction to send tokens to multiple recipients, saving gas by reducing overhead (transaction cost, calldata, repeated function calls).
- Sending N single transfers individually incurs repeated fixed costs per transaction, leading to higher total gas usage.
- **Result:**  
  Our tests showed the batch airdrop saved approximately **X%** gas compared to N single transfers.
- If batch airdrop did **not** save gas, possible reasons include:
  - Contract implementation details (e.g., looping overhead)
  - Small number of recipients where overhead per recipient is minimal
  - Gas optimizations in single transfers on certain networks

---

## c. Issues Encountered and Solutions

- **Error: "Property 'args' does not exist on Log"**  
  - *Fix:* Cast logs to `any` or extract event ABI properly to parse arguments.

- **ABI Event Name Not Found or Unused Variable Warnings**  
  - *Fix:* Extract event definitions from ABI dynamically and use them correctly in `getLogs`.

- **TypeScript Type Errors with `abi` in getLogs**  
  - *Fix:* Correctly type the ABI for events and ensure `abi` property is passed in correct context.

- **Gas Limit Errors During Transactions**  
  - *Fix:* Adjust gas limits manually based on estimated usage.

- **Batch Airdrop Gas Comparison Missing**  
  - *Fix:* Added loops for single transfers and computed gas usage totals to compare.