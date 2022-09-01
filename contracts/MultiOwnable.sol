// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title Custom version of 'Ownable'.
 * @dev This contract expands a standard template contract 'Ownable' with possibility
 * to have more than 1 owner. You should not use this contract if you want to have one owner
 * only: this will lead to gas overspending. It would be better to use standart 'Ownable' instead.
 *
 * It may seem unlogic that we use mapping and array both instead of array only, but mapping can 
 * save a lot of gas when checking caller is one of the owners or not (we do not need to loop whole
 * array every time).
 */
contract MyOwnable {
    mapping (address => bool) isOwner;
    address[] owners;

    /**
    * @dev Sets contract deployer and addresses from `additionalOwners_` array as owners.
    * @param additionalOwners_ is an array of addresses that will be set as owners besides the contract deployer.
    */
    constructor(address[] memory additionalOwners_) {
        owners.push(msg.sender);
        isOwner[msg.sender] = true;

        uint256 ownersLength = additionalOwners_.length;
        for(uint256 i; i < ownersLength; ) {
            owners.push(additionalOwners_[i]);
            isOwner[additionalOwners_[i]] = true;
            unchecked { ++i; }
        }
    }

    /**
    * @dev Throws an error if caller of the function is not one of the owners.
    */
    modifier onlyOwner() virtual {
        require(isOwner[msg.sender], "MyOwnable: You are not one of the owners!");
        _;
    }

    /**
    * @notice Returns an array of addresses of owners.
    */
    function getOwners() external view virtual returns(address[] memory) {
        return owners;
    }

    /**
    * @notice Makes another person an owner.
    * Requirements: caller must be an owner and `newOwner` must not be an owner.
    *
    * @param newOwner is an address of a new owner.
    */
    function addOwner(address newOwner) external virtual onlyOwner {
        require(!isOwner[newOwner], "MyOwnable: This address is already an owner!");
        owners.push(newOwner);
        isOwner[newOwner] = true;
    }
}