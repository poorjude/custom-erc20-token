// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "./IERC20.sol";
import "./MultiOwnable.sol";

/**
 * @title ERC20 token with custom mint functions (and not only).
 * 
 * @dev This contract implements all functions of IERC20 and has mint functions that are not set by 
 * the standard.
 *
 * Mint logic: it is possible to mint strictly declared amount of tokens in strictly declared period
 * of time till current supply does not reach maximum supply (all these are set at contract creation).
 * Also, there is a possibility to stop mint at all: no one will be able to create tokens anymore
 * after calling special function.
 *
 * There is NO implementation of first (creation-time) mint and NO implementation of mint control
 * (basically, anyone can call a mint function). All this should be implemented in a different contract
 * that inherits this one.
 */
contract MyERC20Mint is IERC20 {
    /**
    * @dev See {IERC20-balanceOf}.
    */
    mapping(address => uint256) public override balanceOf;

    /**
    * @dev See {IERC20-allowance}.
    */
    mapping(address => mapping(address => uint256)) public override allowance;

    /**
    * @dev See {IERC20-totalSupply}.
    */
    uint256 public override totalSupply;
    uint256 public maxSupply;

    bool public allowMint = true;
    uint128 public amountToMint;
    uint64 public lastTimeMinted;
    uint64 public intervalOfMint;

    /**
    * @dev Specifies custom mint settings.
    * As there is no realisation of first (creation-time) mint, `lastTimeMinted` is not set.
    *
    * @param maxSupply_ sets maximum supply of your tokens that cannot be exceeded by minting.
    * @param amountToMint_ sets how many tokens should be minted at a time.
    * @param intervalOfMint_ sets (in seconds!) how often it is possible to mint.
    */
    constructor(
                uint256 maxSupply_,
                uint128 amountToMint_,
                uint64 intervalOfMint_
                ) {
        maxSupply = maxSupply_;
        amountToMint = amountToMint_;
        intervalOfMint = intervalOfMint_;
    }

    /**
    * @dev Throws an error if mint is not allowed anymore or if time has not passed to mint again.
    */
    modifier mintLimitation() virtual {
        require(allowMint, "MyMint: Mint is not allowed anymore!");
        require(uint64(block.timestamp) >= lastTimeMinted + intervalOfMint, "MyMint: It is too early to mint yet!");
        _;
    }

    /**
    * @dev See {IERC20-transfer}.
    */
    function transfer(address to, uint256 amount) external override virtual returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    /**
    * @dev See {IERC20-approve}.
    */
    function approve(address spender, uint256 amount) external override virtual returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
    * @dev See {IERC20-transferFrom}.
    */
    function transferFrom(address from, address to, uint256 amount) external override virtual returns (bool) {
        uint256 allowanceAmount = allowance[from][msg.sender];
        require(allowanceAmount >= amount, "MyERC20: Not enough approved tokens for `transferFrom`!");
        if (allowanceAmount != type(uint256).max) {
            // It is already checked that 'allowance[from][msg.sender]' >= 'amount'
            // so overflow is not possible.
            unchecked { allowance[from][msg.sender] -= amount; }
        }
        _transfer(from, to, amount);
        return true;
    }

        /**
    * @notice Mints preset amount of tokens.
    * @param to sets what address should get minted tokens.
    *
    * @dev If not overridden, anyone could call this function.
    */
    function mint(address to) public virtual mintLimitation {
        _mint(to);
        lastTimeMinted = uint64(block.timestamp);
    }

    /**
    * @notice Prohibit possibility to mint at all for anyone.
    *
    * @dev If not overridden, anyone could call this function.
    */
    function prohibitMint() public virtual {
        allowMint = false;
    }

    /**
    * @dev Mints tokens to address `to`.
    * Checks that minting does not make current supply exceed maximum supply. Pay attention: 
    * this function does not update 'lastTimeMinted'! This is done in external 'mint' function.
    */
    function _mint(address to) internal virtual {
        require(totalSupply + amountToMint <= maxSupply, "MyMint: You reached maximum supply!");
        // 'require' has already checked that 'totalSupply + amountToMint' does not overflow
        // and 'balanceOf[to]' could be maximum 'totalSupply' so it does not overflow too.
        unchecked {
            balanceOf[to] += amountToMint;
            totalSupply += amountToMint;
        }
        emit Transfer(address(0), to, amountToMint);
    }

    /**
    * @dev Transfer tokens from one address to another.
    * Checks whether `from` balance is sufficient or not.
    */
    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(balanceOf[from] >= amount, "MyERC20: Not enough tokens for `transfer`!");
        unchecked {
            // It is already checked that 'balanceOf[from]' >= 'amount'
            // and 'balanceOf[To] += amount' could be maximum 'totalSupply' 
            // so overflow is not possible.
            balanceOf[from] -= amount;
            balanceOf[to] += amount; 
        }
        emit Transfer(from, to, amount);
    }
}



/**
 * @title Custom ERC20 token.
 * @dev This contract connects 'MyERC20Mint' logic with 'MyOwnable' logic.
 * 
 * In this token mint function can be called by one of the owners only as well as mint prohibiting
 * function. Also, all owners get initial tokens: as many as it is posiible to get at "usual" mint.
 * 
 * Name of token and symbol of token are set during construction of contract.
 */
contract MyERC20MintOwnable is MyERC20Mint, MyOwnable {
    string public tokenName;
    string public tokenSymbol;

    /**
    * @dev Sets name and symbol of token, gives initial amount of tokens to owners.
    * 
    * @param name_ sets name of token.
    * @param symbol_ sets symbol of token.
    * @dev For other parameters see {MyERC20Mint-constructor} and {MyOwnable-constructor}.
    */
    constructor(
                string memory name_,
                string memory symbol_,
                uint256 maxSupply_,
                uint128 amountToMint_,
                uint64 intervalOfMint_,
                address[] memory additionalOwners_
                ) MyERC20Mint(maxSupply_, amountToMint_, intervalOfMint_)
                MyOwnable(additionalOwners_) {
        tokenName = name_;
        tokenSymbol = symbol_;
        
        // Minting tokens to all owners.
        uint256 ownersLength = owners.length;
        for (uint256 i; i < ownersLength; ) {
            _mint(owners[i]);
            unchecked { ++i; }
        }
        // 'lastTimeMinted' is set here.
        lastTimeMinted = uint64(block.timestamp);
    }

    /**
    * @dev Override {MyERC20Mint-mint} with `onlyOwner` modifier.
    */
    function mint(address to) public override onlyOwner {
        super.mint(to);
    }

    /**
    * @dev Override {MyERC20Mint-prohibitMint} with `onlyOwner` modifier.
    */
    function prohibitMint() public override onlyOwner {
        super.prohibitMint();
    }
}