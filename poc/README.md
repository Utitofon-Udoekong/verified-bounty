# Verified Wallet Security PoCs

This directory contains Proof of Concept (PoC) scripts for vulnerabilities discovered in the Verified Wallet Chrome Extension.

## 🚨 CRITICAL FINDINGS SUMMARY

| Severity | Count | Most Critical |
|----------|-------|---------------|
| 🔴 CRITICAL | 2 | Session signer private keys in localStorage |
| 🟠 HIGH | 4 | Backend secrets exposed, postMessage bypass |
| 🟡 MEDIUM | 4 | API keys, clipboard exposure |

---

## Prerequisites

```bash
npm install
```

## PoC Scripts

### 🔴 CRITICAL

#### 1. Session Signer Private Key Exposure (`06-session-signer-pk-exposure.ts`)

**CVSS: 9.0+ (CRITICAL)**

The Biconomy SDK stores session signer **private keys in plaintext** in localStorage!

**Location**: `utils/helpers.js:153249`
```javascript
localStorage.setItem(this.getStorageKey("signers"), JSON.stringify(signers));
// signers = { "0xAddress": { pvKey: "0x...", pbKey: "0x..." } }
```

**Run in browser console**:
```javascript
// Scan for session signer keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.endsWith("_signers")) {
    console.log("FOUND:", key, localStorage.getItem(key));
  }
}
```

---

#### 2. Backend Secrets Exposure (`07-backend-secrets-exposure.ts`)

**CVSS: 8.0+ (HIGH/CRITICAL)**

Multiple backend secrets exposed in client code:
- **Azure Function Key**: `23o7dHkKdIMtjnft5q/J4mqpdBqqOOuajepmYqY0eAi9TaqQYsVSBA==`
- **Firebase API Key**: `AIzaSyC9NftjURlBho082sU7jzkLfI25ChqOUrk`
- **Firebase App ID**: `1:575278027010:web:efde7726d858a8b9ff721b`

**Run with Node.js**:
```bash
npx ts-node poc/07-backend-secrets-exposure.ts
```

---

### 🟠 HIGH

#### 3. localStorage Vault Leak (`01-localstorage-vault-leak.ts`)

**CVSS: 7.5**

Vault data stored in localStorage accessible to any page script.

---

#### 4. Message Injection (`02-message-injection.ts`)

**CVSS: 7.5**

postMessage with wildcard origin allows message interception.

---

#### 5. SDK Helper Function Injection (`04-sdk-helper-injection.tsx`)

**CVSS: 7.5**

Helper functions can intercept PIN hashes and co-signer info.

---

#### 6. Combined Attack Chain (`05-combined-attack-chain.ts`)

**CVSS: 8.0**

Full multi-stage attack demonstration.

---

### 🟡 MEDIUM

#### 7. API Key Exposure (`03-api-key-exposure.js`)

**CVSS: 5.0** ✅ **VERIFIED ACTIVE**

```bash
node poc/03-api-key-exposure.js
```

Output confirms:
- Alchemy key: VALID (tested at block #24,009,831)
- Etherscan key: VALID

---

#### 8. Clipboard Exposure (`08-clipboard-exposure.ts`)

**CVSS: 5.5**

Private key copy-to-clipboard risks.

---

## Complete Vulnerability Summary

| ID | Vulnerability | File | Severity | CVSS |
|----|---------------|------|----------|------|
| 1 | **Session signer pvKey in localStorage** | helpers.js:153249 | 🔴 CRITICAL | 9.0+ |
| 2 | **Azure Function Key Exposed** | helpers.js:658241 | 🔴 CRITICAL | 8.5 |
| 3 | **Firebase Config Exposed** | helpers.js:658242-658250 | 🟠 HIGH | 7.5 |
| 4 | **postMessage Wildcard Origin** | content.js:22999 | 🟠 HIGH | 7.5 |
| 5 | **localStorage Vault Storage** | injected.js:2306 | 🟠 HIGH | 7.5 |
| 6 | **SDK Helper Injection** | SDK integration | 🟠 HIGH | 7.5 |
| 7 | **Alchemy API Key** | content.js:22667 | 🟡 MEDIUM | 5.0 |
| 8 | **Etherscan API Key** | content.js:22671 | 🟡 MEDIUM | 4.5 |
| 9 | **WalletConnect ProjectID** | content.js:22653 | 🟡 MEDIUM | 5.0 |
| 10 | **Clipboard Private Key Exposure** | Popup/index.js:720852 | 🟡 MEDIUM | 5.5 |
| 11 | **Firebase VAPID Key** | helpers.js:658251 | 🟡 MEDIUM | 4.0 |
| 12 | **Weak Origin Validation** | content.js:22976 | 🟠 HIGH | 7.0 |

---

## Responsible Disclosure

These PoCs are created for the Verified Wallet Security Hackathon.

**Hackathon Details**:
- **End Date**: December 30, 2025
- **Prize Pool**: Up to $5,000 USD
  - Critical: Up to $2,500
  - High: Up to $1,500
  - Medium: Up to $750
  - Low: Up to $250

All vulnerabilities should be reported through proper channels.

---

## Files

```
poc/
├── 01-localstorage-vault-leak.ts     # Vault data theft
├── 02-message-injection.ts           # postMessage attack
├── 03-api-key-exposure.js            # API key validation ✅ TESTED
├── 04-sdk-helper-injection.tsx       # SDK helper abuse
├── 05-combined-attack-chain.ts       # Multi-stage attack
├── 06-session-signer-pk-exposure.ts  # 🔴 CRITICAL: PK theft
├── 07-backend-secrets-exposure.ts    # Backend secrets
├── 08-clipboard-exposure.ts          # Clipboard risks
└── README.md                         # This file
```
