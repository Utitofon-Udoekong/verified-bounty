============================================================
# VERIFIED WALLET - API KEY EXPOSURE PoC
**EXTRACTED** **API** **KEYS**:
{
    *alchemy*: {
    *key*: *82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ*,
    *endpoints*: {
    *ethereum*: "[https://eth-mainnet.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ",](https://eth-mainnet.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ*,)
    *base*: *[https://base-mainnet.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ",](https://base-mainnet.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ*,)
    *sepolia*: *[https://eth-sepolia.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ"](https://eth-sepolia.g.alchemy.com/v2/82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ*)
    }
    },
    *etherscan*: {
    *key*: *M8SGUPC8CXRTER5GGTSSXW7C9A1ZINWWYA*,
    *apiUrl*: *[https://api.etherscan.io/v2/api*](https://api.etherscan.io/v2/api*)
    },
    *walletConnect*: {
    *projectId*: *90b0e2ff886ba98147f2780659cf12a6*
    }
}

------------------------------------------------------------ Testing Alchemy **API** Key...

Alchemy key is **VALID** and **ACTIVE**!
    Current Ethereum block: **24009831**
    Key: 82hkNrfu6ZZ8Wms2vr1U331ml3FtS7AZ

   This key could be rate-limited by attackers

Testing Etherscan **API** Key...

Etherscan key is **VALID** and **ACTIVE**! Key: **M8SGUPC8CXRTER5GGTSSXW7C9A1ZINWWYA**

   This key could be used to make 5 req/sec

WalletConnect Project ID Exposure...

Project ID: 90b0e2ff886ba98147f2780659cf12a6

Risks:
    1. Attacker can create fake wallet connections using this ID
    2. Usage metrics will be inflated/manipulated
    3. Potential for phishing by impersonating 'Verified Wallet'

============================================================
**RECOMMENDATIONS**:
    1. Use server-side proxy for **RPC** calls
    2. Rotate exposed **API** keys immediately
    3. Implement rate limiting on client side
#   4. Consider using environment-specific keys