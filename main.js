// ============================================
// Web3.js DApp - MetaMask Integration
// ============================================

// Global variables
let web3 = null;
let contract = null;
let userAccount = null;

// ============================================
// Logging System with Error Handling
// ============================================

class Logger {
    constructor(containerId = 'logs') {
        this.container = document.getElementById(containerId);
        this.maxLogs = 50;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('uz-UZ');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${this._sanitize(message)}`;
        
        this.container.insertBefore(logEntry, this.container.firstChild);
        
        // Keep only the latest logs
        while (this.container.children.length > this.maxLogs) {
            this.container.removeChild(this.container.lastChild);
        }

        console.log(`[${type.toUpperCase()}]`, message);
    }

    info(message) { this.log(message, 'info'); }
    success(message) { this.log(message, 'success'); }
    error(message) { this.log(`❌ Xato: ${message}`, 'error'); }
    warning(message) { this.log(`⚠️  Ogohlantirish: ${message}`, 'warning'); }

    _sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clear() {
        this.container.innerHTML = '';
        console.log('Logs cleared');
    }
}

const logger = new Logger();

// ============================================
// Error Handler
// ============================================

class Web3ErrorHandler {
    static handle(error, context = '') {
        let errorMessage = '';

        if (error.code === 'NETWORK_ERROR') {
            errorMessage = 'Tarmoq ulanishi xatosi. Rpc URL-ni tekshiring.';
        } else if (error.code === 'INVALID_ADDRESS') {
            errorMessage = 'Noto\'g\'ri manzil formati.';
        } else if (error.message?.includes('insufficient funds')) {
            errorMessage = 'Yetarli mablag\' yo\'q. Gas uchun ETH kerak.';
        } else if (error.message?.includes('User rejected')) {
            errorMessage = 'Foydalanuvchi tranzaksiyani rad etdi.';
        } else if (error.message?.includes('gas')) {
            errorMessage = 'Gas parametrlarida xato: ' + error.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else {
            errorMessage = 'Noma\'lum xato yuz berdi.';
        }

        const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
        logger.error(fullMessage);

        return {
            success: false,
            message: fullMessage,
            originalError: error
        };
    }

    static isValidAddress(address) {
        try {
            return web3 && web3.utils.isAddress(address);
        } catch {
            return false;
        }
    }
}

// ============================================
// MetaMask Connection
// ============================================

async function connectMetaMask() {
    try {
        logger.info('MetaMask ulanishi boshlandi...');

        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask o\'rnatilmagan. Iltimos, MetaMask extension-ni o\'rnating.');
        }

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        userAccount = accounts[0];
        logger.success(`MetaMask ulandi: ${userAccount}`);

        // Initialize Web3
        web3 = new Web3(window.ethereum);

        // Update UI
        await updateAccountInfo();
        showElement('accountInfo');

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', handleChainChange);

        // Set RPC URL
        const rpcInput = document.getElementById('rpcUrl');
        const networkId = await web3.eth.net.getId();
        logger.info(`Network ID: ${networkId}`);

        return true;
    } catch (error) {
        Web3ErrorHandler.handle(error, 'MetaMask ulanishi');
        return false;
    }
}

async function updateAccountInfo() {
    try {
        const balance = await web3.eth.getBalance(userAccount);
        const balanceEth = web3.utils.fromWei(balance, 'ether');
        const networkId = await web3.eth.net.getId();
        
        const networks = {
            1: 'Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            1337: 'Localhost',
            31337: 'Hardhat'
        };

        document.getElementById('account').textContent = userAccount;
        document.getElementById('balance').textContent = parseFloat(balanceEth).toFixed(4);
        document.getElementById('network').textContent = networks[networkId] || `Network ${networkId}`;

        logger.info(`Balans: ${parseFloat(balanceEth).toFixed(4)} ETH`);
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Balans o\'qish');
    }
}

function handleAccountChange(accounts) {
    if (accounts.length === 0) {
        userAccount = null;
        hideElement('accountInfo');
        logger.warning('MetaMask ulanishdan chiqtingiz.');
    } else {
        userAccount = accounts[0];
        updateAccountInfo();
        logger.info(`Hisob o\'zgartirildi: ${userAccount}`);
    }
}

function handleChainChange(chainId) {
    logger.warning(`Tarmoq o\'zgartirildi: ${parseInt(chainId, 16)}`);
    location.reload();
}

// ============================================
// Smart Contract Interaction
// ============================================

// Sample ERC20 ABI
const SAMPLE_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
];

async function loadContract() {
    try {
        const contractAddress = document.getElementById('contractAddress').value.trim();
        const rpcUrl = document.getElementById('rpcUrl').value.trim();

        // Validate address
        if (!Web3ErrorHandler.isValidAddress(contractAddress)) {
            throw new Error('Noto\'g\'ri kontakt manzili.');
        }

        logger.info('Kontrakt o\'yilmoqda...');

        // Connect to custom RPC if provided
        if (rpcUrl && rpcUrl !== 'http://localhost:8545') {
            web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
            logger.info(`RPC ulandi: ${rpcUrl}`);
        }

        // Create contract instance
        contract = new web3.eth.Contract(SAMPLE_ABI, contractAddress);

        logger.success(`Kontrakt o\'yildi: ${contractAddress}`);
        updateStatus(`✅ Kontrakt muvaffaqiyatli o\'yildi`, 'success');

        // Load available functions
        loadAvailableFunctions();

        return true;
    } catch (error) {
        const result = Web3ErrorHandler.handle(error, 'Kontrakt o\'yish');
        updateStatus(result.message, 'error');
        return false;
    }
}

function loadAvailableFunctions() {
    logger.info('Mavjud funksiyalar ro\'yxati yuklandi');
}

// ============================================
// Call View Functions (Read)
// ============================================

async function callViewFunction() {
    try {
        if (!contract) {
            throw new Error('Avval kontrakt o\'yilishi kerak.');
        }

        const functionName = document.getElementById('functionName').value;
        
        if (!functionName) {
            throw new Error('Funksiya tanlang.');
        }

        logger.info(`Funksiya chaqirilmoqda: ${functionName}()...`);

        let result;

        if (functionName === 'balanceOf') {
            const address = document.getElementById('functionParams').value.trim();
            if (!Web3ErrorHandler.isValidAddress(address)) {
                throw new Error('Noto\'g\'ri manzil.');
            }
            result = await contract.methods.balanceOf(address).call();
        } else {
            result = await contract.methods[functionName]().call();
        }

        logger.success(`Natija: ${result}`);
        displayFunctionResult(result, functionName);

        return result;
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Funksiya chaqiruvi');
        return null;
    }
}

function displayFunctionResult(result, functionName) {
    const resultDiv = document.getElementById('functionResult');
    resultDiv.className = 'result success show';
    
    let formattedResult = result;
    if (functionName === 'totalSupply' || functionName === 'balanceOf') {
        formattedResult = web3.utils.fromWei(result, 'ether');
    }

    resultDiv.innerHTML = `
        <strong>Funksiya:</strong> ${functionName}()<br>
        <strong>Natija:</strong> <code>${formattedResult}</code><br>
        <small class="log-timestamp">${new Date().toLocaleString('uz-UZ')}</small>
    `;
}

// ============================================
// Send Transactions (Write)
// ============================================

async function sendTransaction() {
    try {
        if (!web3 || !userAccount) {
            throw new Error('MetaMask ulangan emas.');
        }

        const toAddress = document.getElementById('toAddress').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const gasLimit = parseInt(document.getElementById('gasLimit').value);
        const gasPriceGwei = parseFloat(document.getElementById('gasPrice').value);

        // Validation
        if (!Web3ErrorHandler.isValidAddress(toAddress)) {
            throw new Error('Noto\'g\'ri manzil.');
        }
        if (!amount || isNaN(amount)) {
            throw new Error('Noto\'g\'ri miqdor.');
        }
        if (!gasLimit || gasLimit <= 0) {
            throw new Error('Gas limit musbat son bo\'lishi kerak.');
        }
        if (!gasPriceGwei || gasPriceGwei <= 0) {
            throw new Error('Gas price musbat son bo\'lishi kerak.');
        }

        const gasPriceWei = web3.utils.toWei(gasPriceGwei.toString(), 'gwei');

        logger.info('Tranzaksiya tayyorlanmoqda...');
        logger.info(`Manzil: ${toAddress}`);
        logger.info(`Miqdor: ${amount}`);
        logger.info(`Gas Limit: ${gasLimit}`);
        logger.info(`Gas Price: ${gasPriceGwei} Gwei (${web3.utils.fromWei(gasPriceWei, 'gwei')} Gwei)`);

        // Estimate gas
        const estimatedGas = await web3.eth.estimateGas({
            from: userAccount,
            to: toAddress,
            value: amount
        });

        logger.info(`Taxminiy gas: ${estimatedGas}`);

        if (estimatedGas > gasLimit) {
            logger.warning(`Taxminiy gas smetaga o\'tib ketdi. Tavsiya: ${estimatedGas}`);
        }

        // Create transaction
        const tx = {
            from: userAccount,
            to: toAddress,
            value: amount,
            gas: gasLimit,
            gasPrice: gasPriceWei
        };

        logger.info('Tranzaksiya foydalanuvchida tasdiqlanmoqda...');

        // Send transaction
        const result = await web3.eth.sendTransaction(tx);

        logger.success(`Tranzaksiya yuborildi! TX Hash: ${result}`);
        displayTransactionResult(result);

        // Wait for receipt
        logger.info('Tranzaksiya tasdiqlanishi kutilmoqda...');
        const receipt = await waitForTransactionReceipt(result, 30000);

        if (receipt) {
            logger.success(`Tranzaksiya tasdiqlandi! Block: ${receipt.blockNumber}`);
            logger.info(`Gas ishlatilib: ${receipt.gasUsed}`);
        }

        return result;
    } catch (error) {
        Web3ErrorHandler.handle(error, 'Tranzaksiya yuborish');
        return null;
    }
}

async function waitForTransactionReceipt(txHash, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const receipt = await web3.eth.getTransactionReceipt(txHash);
            if (receipt) return receipt;
        } catch (error) {
            logger.error(`Kvitansiya o\'qish: ${error.message}`);
        }
        await sleep(2000);
    }

    logger.warning('Tranzaksiya tasdiqi vaqti tugadi.');
    return null;
}

function displayTransactionResult(txHash) {
    const resultDiv = document.getElementById('txResult');
    resultDiv.className = 'result success show';
    resultDiv.innerHTML = `
        <strong>TX Hash:</strong> <code>${txHash}</code><br>
        <strong>Status:</strong> Tasdiqlanishi kutilmoqda...<br>
        <small class="log-timestamp">${new Date().toLocaleString('uz-UZ')}</small>
    `;
}

// ============================================
// Utility Functions
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('contractStatus');
    statusDiv.className = `status show ${type}`;
    statusDiv.textContent = message;
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Connect MetaMask button
    document.getElementById('connectBtn').addEventListener('click', async function() {
        const spinner = document.getElementById('spinner');
        spinner.classList.add('active');
        await connectMetaMask();
        spinner.classList.remove('active');
    });

    // Load Contract button
    document.getElementById('loadContractBtn').addEventListener('click', loadContract);

    // Call Function button
    document.getElementById('callFunctionBtn').addEventListener('click', callViewFunction);

    // Send Transaction button
    document.getElementById('sendTxBtn').addEventListener('click', sendTransaction);

    // Clear Logs button
    document.getElementById('clearLogs').addEventListener('click', () => logger.clear());

    // Show/Hide params for balanceOf
    document.getElementById('functionName').addEventListener('change', function() {
        const paramsContainer = document.getElementById('paramsContainer');
        if (this.value === 'balanceOf') {
            paramsContainer.style.display = 'block';
        } else {
            paramsContainer.style.display = 'none';
        }
    });

    // Listen for MetaMask connection on page load
    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    logger.info('MetaMask avvaldan ulangan.');
                }
            });
    }

    logger.info('DApp o\'yildi. MetaMask ulanishini boshlang.');
});
