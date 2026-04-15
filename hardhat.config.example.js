/**
 * Hardhat Configuration Namunasi
 * 
 * Foydalanish:
 * 
 * 1. Hardhat-ni o'rnating:
 *    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
 * 
 * 2. Loyihani initsyallashtiringi:
 *    npx hardhat
 * 
 * 3. Localhost nodeni ishga tushiring:
 *    npx hardhat node
 * 
 * 4. Boshqa terminal-da kontraktni deploy qiling:
 *    npx hardhat run scripts/deploy.js --network localhost
 */

require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    // Localhost - Hardhat
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      },
      gasPrice: 875000000 // 0.875 gwei
    },

    // Localhost - Ganache-CLI
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 5777
    },

    // Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },

    // Goerli Testnet (deprecated)
    goerli: {
      url: process.env.GOERLI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5
    },

    // Polygon Testnet (Mumbai)
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001
    },

    // Ethereum Mainnet
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1
    }
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  mocha: {
    timeout: 40000
  }
};
