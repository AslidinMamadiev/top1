/**
 * Node.js Web3.js Programmatic Usage Example
 * 
 * Foydalanish:
 * node web3-script.js
 */

const Web3 = require('web3');
require('dotenv').config();
const fs = require('fs');

// ============================================
// Configuration
// ============================================

const RPC_URL = process.env.REACT_APP_RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const GAS_LIMIT = parseInt(process.env.GAS_LIMIT_DEFAULT) || 100000;
const GAS_PRICE_GWEI = parseInt(process.env.GAS_PRICE_GWEI) || 20;

// ============================================
// Initialize Web3
// ============================================

const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

console.log('✅ Web3 ulandi:', RPC_URL);

// ============================================
// Load ABI
// ============================================

function loadABI(filePath = './contracts/ERC20_ABI.json') {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const abi = JSON.parse(data);
        console.log('✅ ABI yuklandi');
        return abi;
    } catch (error) {
        console.error('❌ ABI yuklanmadi:', error.message);
        return null;
    }
}

// ============================================
// Error Handler
// ============================================

class Web3ErrorHandler {
    static handle(error, context = '') {
        let errorMessage = '';

        if (error.code === -32603) {
            errorMessage = 'RPC Server xatosi. Localhost:8545 ishlayotganligini tekshiring.';
        } else if (error.message?.includes('insufficient funds')) {
            errorMessage = 'Yetarli ETH mablag\' yo\'q.';
        } else if (error.message?.includes('Invalid address')) {
            errorMessage = 'Noto\'g\'ri manzil formati.';
        } else if (error.message?.includes('revert')) {
            errorMessage = 'Smart kontrakt rejectedni qaytaradi.';
        } else {
            errorMessage = error.message || JSON.stringify(error);
        }

        const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
        console.error(`❌ Xato - ${fullMessage}`);

        return {
            success: false,
            message: fullMessage,
            originalError: error
        };
    }

    static isValidAddress(address) {
        return web3.utils.isAddress(address);
    }
}

// ============================================
// Account Management
// ============================================

async function getAccountInfo(address) {
    try {
        console.log('\n📊 Hisob Ma\'lumotlari:');
        console.log('─'.repeat(50));

        const balance = await web3.eth.getBalance(address);
        const balanceEth = web3.utils.fromWei(balance, 'ether');
        const code = await web3.eth.getCode(address);
        const txCount = await web3.eth.getTransactionCount(address);

        console.log(`📍 Manzil: ${address}`);
        console.log(`💰 Balans: ${balanceEth} ETH`);
        console.log(`🔢 Nonce: ${txCount}`);
        console.log(`🔍 Kontrakt kodi: ${code === '0x' ? 'Yo\'q (EOA)' : 'Ha (Kontrakt)'}`);

        return {
            address,
            balance: balanceEth,
            code,
            txCount
        };
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Hisob ma\'lumoti olish');
        return null;
    }
}

// ============================================
// Network Information
// ============================================

async function getNetworkInfo() {
    try {
        console.log('\n🌐 Tarmoq Ma\'lumotlari:');
        console.log('─'.repeat(50));

        const networkId = await web3.eth.net.getId();
        const isListening = await web3.eth.net.isListening();
        const peerCount = await web3.net.getPeerCount();
        const blockNumber = await web3.eth.getBlockNumber();
        const gasPrice = await web3.eth.getGasPrice();
        const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');

        console.log(`🆔 Network ID: ${networkId}`);
        console.log(`📡 Listening: ${isListening}`);
        console.log(`👥 Peer Count: ${peerCount}`);
        console.log(`📦 Block Number: ${blockNumber}`);
        console.log(`⛽ Gas Price: ${gasPriceGwei} Gwei`);

        return {
            networkId,
            isListening,
            peerCount,
            blockNumber,
            gasPrice: gasPriceGwei
        };
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Tarmoq ma\'lumoti');
        return null;
    }
}

// ============================================
// Read Block Information
// ============================================

async function getBlockInfo(blockNumber = 'latest') {
    try {
        console.log(`\n📦 Block Ma\'lumotlari (${blockNumber}):`);
        console.log('─'.repeat(50));

        const block = await web3.eth.getBlock(blockNumber);

        console.log(`🔷 Block Hash: ${block.hash}`);
        console.log(`📊 Block Number: ${block.number}`);
        console.log(`⏰ Timestamp: ${new Date(block.timestamp * 1000).toLocaleString('uz-UZ')}`);
        console.log(`⛏️  Miner: ${block.miner}`);
        console.log(`🔗 Parent Hash: ${block.parentHash}`);
        console.log(`⛽ Gas Used: ${block.gasUsed}`);
        console.log(`⛽ Gas Limit: ${block.gasLimit}`);
        console.log(`📈 Transactions: ${block.transactions.length}`);

        return block;
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Block ma\'lumoti');
        return null;
    }
}

// ============================================
// Call View Functions
// ============================================

async function callViewFunction(contractAddress, abi, functionName, params = []) {
    try {
        console.log(`\n📖 View Funksiyasi Chaqiruvi: ${functionName}`);
        console.log('─'.repeat(50));

        if (!Web3ErrorHandler.isValidAddress(contractAddress)) {
            throw new Error('Noto\'g\'ri kontrakt manzili');
        }

        const contract = new web3.eth.Contract(abi, contractAddress);
        const method = contract.methods[functionName];

        if (!method) {
            throw new Error(`Funksiya topilmadi: ${functionName}`);
        }

        const result = await method(...params).call();

        console.log(`✅ Natija (${functionName}):`, result);

        return result;
    } catch (error) {
        Web3ErrorHandler.handle(error, 'View funksiyasi');
        return null;
    }
}

// ============================================
// Send Transaction
// ============================================

async function sendTransaction(fromAddress, toAddress, valueEth, privateKey = null) {
    try {
        console.log(`\n💸 Tranzaksiya Yuborish`);
        console.log('─'.repeat(50));

        if (!Web3ErrorHandler.isValidAddress(fromAddress)) {
            throw new Error('Noto\'g\'ri yuboriluvchi manzili');
        }
        if (!Web3ErrorHandler.isValidAddress(toAddress)) {
            throw new Error('Noto\'g\'ri qabul qiluvchi manzili');
        }

        const valueWei = web3.utils.toWei(valueEth.toString(), 'ether');
        const gasPriceWei = web3.utils.toWei(GAS_PRICE_GWEI.toString(), 'gwei');

        console.log(`📤 Yuboriluvchi: ${fromAddress}`);
        console.log(`📥 Qabul qiluvchi: ${toAddress}`);
        console.log(`💰 Miqdor: ${valueEth} ETH`);
        console.log(`⛽ Gas Limit: ${GAS_LIMIT}`);
        console.log(`⛽ Gas Price: ${GAS_PRICE_GWEI} Gwei`);

        // Estimate gas
        const estimatedGas = await web3.eth.estimateGas({
            from: fromAddress,
            to: toAddress,
            value: valueWei
        });

        console.log(`📊 Taxminiy gas: ${estimatedGas}`);

        const tx = {
            from: fromAddress,
            to: toAddress,
            value: valueWei,
            gas: GAS_LIMIT,
            gasPrice: gasPriceWei
        };

        // Agar privat kalit bo'lsa, imzolang va yuboring
        if (privateKey) {
            console.log('🔐 Tranzaksiya imzolanmoqda...');

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
            const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            console.log('✅ Tranzaksiya yuborildi!');
            console.log(`📌 TX Hash: ${result.transactionHash}`);
            console.log(`📦 Block Number: ${result.blockNumber}`);
            console.log(`💨 Gas Used: ${result.gasUsed}`);

            return result;
        } else {
            // Aks holda, hisob ma\'lumotlarini qaytaring (MetaMask uchun)
            console.log('⚠️  Privat kalit berilmadi. MetaMask dan foydalaning.');
            console.log('TX Object:', JSON.stringify(tx, null, 2));

            return tx;
        }
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Tranzaksiya yuborish');
        return null;
    }
}

// ============================================
// Listen to Events
// ============================================

async function listenToTransfers(contractAddress, abi) {
    try {
        console.log(`\n👂 Transfer Eventlarini Tinglash`);
        console.log('─'.repeat(50));

        const contract = new web3.eth.Contract(abi, contractAddress);

        contract.events.Transfer({
            fromBlock: 'latest'
        })
            .on('data', (event) => {
                console.log('📨 Transfer Event:');
                console.log(`  From: ${event.returnValues.from}`);
                console.log(`  To: ${event.returnValues.to}`);
                console.log(`  Value: ${event.returnValues.value}`);
            })
            .on('error', (error) => {
                Web3ErrorHandler.handle(error, 'Event tinglaش');
            });
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Event listener');
    }
}

// ============================================
// Main Function
// ============================================

async function main() {
    console.log('═'.repeat(50));
    console.log('🚀 Web3.js Node.js Script');
    console.log('═'.repeat(50));

    try {
        // Network info
        await getNetworkInfo();

        // Block info
        await getBlockInfo('latest');

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            await getAccountInfo(accounts[0]);
        }

        // Example: Call view function
        if (CONTRACT_ADDRESS) {
            const abi = loadABI();
            if (abi) {
                // Call totalSupply
                await callViewFunction(CONTRACT_ADDRESS, abi, 'totalSupply');

                // Call balanceOf
                if (accounts.length > 0) {
                    await callViewFunction(CONTRACT_ADDRESS, abi, 'balanceOf', [accounts[0]]);
                }
            }
        }

        console.log('\n✅ Script muvaffaqiyatli tugatildi.');
        console.log('═'.repeat(50));

    } catch (error) {
        console.error('❌ Asosiy xato:', error);
    }
}

// ============================================
// Export Functions (Node.js modulasi sifatida)
// ============================================

module.exports = {
    web3,
    Web3ErrorHandler,
    getAccountInfo,
    getNetworkInfo,
    getBlockInfo,
    callViewFunction,
    sendTransaction,
    listenToTransfers,
    loadABI
};

// Agar to'g'ridan-to'g'ri ishlatirilsa, main funksiyasini chaqiring
if (require.main === module) {
    main().catch(error => {
        console.error('Dastur xatosi:', error);
        process.exit(1);
    });
}
