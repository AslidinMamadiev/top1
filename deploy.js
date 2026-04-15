/**
 * Hardhat Deployment Script
 * 
 * Foydalanish:
 * npx hardhat run scripts/deploy.js --network localhost
 */

const hre = require("hardhat");

async function main() {
    console.log("═".repeat(50));
    console.log("🚀 Smart Kontrakt Deploy Qilish");
    console.log("═".repeat(50));

    try {
        // Deploy accounts olish
        const [deployer] = await ethers.getSigners();
        console.log("\n📍 Deploy qiluvchi hisob:", deployer.address);

        // Hisob balansni o'qish
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`💰 Balans: ${ethers.utils.formatEther(balance)} ETH`);

        // SimpleToken kontraktini deploy qilish
        console.log("\n🔨 SimpleToken deploy qilinimoqda...");

        const SimpleToken = await ethers.getContractFactory("SimpleToken");
        const initialSupply = 1000000; // 1 million tokens (18 decimals)
        
        const token = await SimpleToken.deploy(initialSupply);
        await token.deployed();

        console.log("✅ SimpleToken deployed!");
        console.log(`📌 Kontrakt adresi: ${token.address}`);

        // Kontrakt ma'lumotlarini o'qish
        console.log("\n📊 Kontrakt Ma'lumotlari:");
        console.log("─".repeat(50));

        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();
        const deployerBalance = await token.balanceOf(deployer.address);

        console.log(`📛 Nom: ${name}`);
        console.log(`🔤 Ramz: ${symbol}`);
        console.log(`🔢 Decimals: ${decimals}`);
        console.log(`📦 Jami Ta'mini: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
        console.log(`💸 Deploy qiluvchi balans: ${ethers.utils.formatEther(deployerBalance)} ${symbol}`);

        // Deployment ma'lumotlarini saqlash
        const deploymentInfo = {
            contractAddress: token.address,
            deployer: deployer.address,
            name: name,
            symbol: symbol,
            decimals: decimals,
            totalSupply: totalSupply.toString(),
            deploymentBlock: await ethers.provider.getBlockNumber(),
            deploymentTime: new Date().toISOString(),
            network: hre.network.name,
            chainId: (await ethers.provider.getNetwork()).chainId
        };

        // JSON faylga saqlash
        const fs = require("fs");
        fs.writeFileSync(
            "deployment-info.json",
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("\n✅ Deployment ma'lumotlari deployment-info.json ga saqlandi");

        // Test transfer
        console.log("\n🧪 Transfer Test:");
        console.log("─".repeat(50));

        const [_, otherAccount] = await ethers.getSigners();
        const transferAmount = ethers.utils.parseEther("100");

        console.log(`📤 Transfer yuborilmoqda: 100 ${symbol}`);
        console.log(`📥 Qabul qiluvchi: ${otherAccount.address}`);

        const tx = await token.transfer(otherAccount.address, transferAmount);
        await tx.wait();

        console.log("✅ Transfer muvaffaqiyatli!");
        console.log(`📌 TX Hash: ${tx.hash}`);

        const otherBalance = await token.balanceOf(otherAccount.address);
        console.log(`💸 Qabul qiluvchi yangi balans: ${ethers.utils.formatEther(otherBalance)} ${symbol}`);

        console.log("\n═".repeat(50));
        console.log("✅ Deploy qilish muvaffaqiyatli tugatildi!");
        console.log("═".repeat(50));

        // Qo'shimcha ma'lumotlar
        console.log("\n💡 Keyingi Qadam:");
        console.log("1. deployment-info.json oching va contractAddress ni nusxalab oling");
        console.log("2. index.html-da contractAddress fieldiga qiymatni kiriting");
        console.log("3. 'Load Contract' tugmasini bosing");
        console.log("4. View funksiyalarini chaqiring yoki tranzaksiya yuboring");

    } catch (error) {
        console.error("❌ Deploy qilish xatosi:", error);
        process.exit(1);
    }
}

// Deploy funksiyasini chaqiring
main();
