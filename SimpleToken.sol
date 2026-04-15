// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title SimpleToken
 * @dev Sodda ERC20 token kontrakti Web3.js testirovkasi uchun
 * 
 * Foydalanish:
 * npx hardhat run scripts/deploy.js --network localhost
 */

contract SimpleToken {
    // Nomlar va ramzlar
    string public name = "Test Token";
    string public symbol = "TST";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // Manzillar bo'yicha balanslar
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Constructor - deploy qilganda chaqiriladi
    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    // Transfer funksiyasi - tokenlarni o'tkazish
    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Noto'g'ri manzil");
        require(balanceOf[msg.sender] >= value, "Yetarli balans yo'q");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);
        return true;
    }

    // TransferFrom funksiyasi - izin olib tokenlarni o'tkazish
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        require(to != address(0), "Noto'g'ri manzil");
        require(balanceOf[from] >= value, "Yetarli balans yo'q");
        require(allowance[from][msg.sender] >= value, "Yetarli izin yo'q");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;

        emit Transfer(from, to, value);
        return true;
    }

    // Approve funksiyasi - harchoq uchun izin berish
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    // Balansni o'qish
    function getBalance(address account) public view returns (uint256) {
        return balanceOf[account];
    }

    // Izinni o'qish
    function getAllowance(address owner, address spender)
        public
        view
        returns (uint256)
    {
        return allowance[owner][spender];
    }

    // Jami 
    function getTotalSupply() public view returns (uint256) {
        return totalSupply;
    }
}
