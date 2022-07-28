# My own ERC20 token (more as an experiment, than as something serious)

Main file `Custom_ERC20.sol` consists of four pieces:
1. IERC20 - Interface of ERC20 token standard.
2. MyOwnable - Version of 'Ownable' pattern but with many owners.
3. MyERC20Mint - Implementation of IERC20 functions and of mint functions that are not set by the standard.
4. MyERC20MintOwnable - As declared in the name, connection of 'MyOwnable' and 'MyERC20Mint' logic, a final contract.

All smart contracts are provided with wide code documentation.
