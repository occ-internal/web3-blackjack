// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BlackjackGame {
    address owner;
    uint256 minimumBetAmount = 100000000000000;
    uint256 payoutAmnt = minimumBetAmount * 2;

    struct Game {
        address player;
        uint256 betAmount;
        uint256 payoutAmount;
        uint256 playerTotal;
        uint256 dealerTotal;
    }

    mapping(address => Game) games;
    mapping(address => uint256) balances;

    modifier onlyOwner() {
        require(owner == msg.sender, "Only the owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function placeBet() public payable {
        require(
            msg.value >= minimumBetAmount,
            "Not enough balance for entry fee"
        );
        uint256 amount = msg.value;
        require(msg.value >= minimumBetAmount, "The bet amount is too low.");

        balances[address(this)] += amount;
        games[msg.sender] = Game(msg.sender, amount, 0, 0, 0);
    }

    function payout() public {
        require(
            balances[address(this)] >= payoutAmnt,
            "Not enough prize money."
        );

        address payable player = payable(games[msg.sender].player);
        _transfer(player, payoutAmnt);
        balances[address(this)] -= payoutAmnt;
    }

    function deposit() public payable virtual {
        require(msg.value > 0, "You don't have enough tokens");
        balances[address(this)] += msg.value;
    }

    function _transfer(address to, uint256 amount) internal virtual {
        require(address(this) != address(0), "transfer from the zero address");
        require(to != address(0), "transfer to the zero address");
        unchecked {
            balances[address(this)] = address(this).balance - amount;
            (bool success, ) = to.call{value: amount}("");
            require(success, "Failed to withdraw entry fee");
            balances[to] += amount;
        }
    }

    function balanceOf(address _address) public view returns (uint256) {
        return balances[_address];
    }

    function withdraw() public onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Failed to withdraw balance");
        balances[address(this)] = address(this).balance;
    }
}
