
**Edit: deployed this contract on Rinkeby testnet and verified its bytecode on Etherscan.**

Etherscan: https://rinkeby.etherscan.io/address/0xe34bedd60b4fedff4f7df8578929e28f4f0e6e44#code

Contract address: 0xe34bEdd60b4FEDFF4F7df8578929E28F4F0e6E44

## My own ERC20 token (more as an experiment)

Main file `Custom_ERC20.sol` consists of four pieces:
1. IERC20 - Interface of ERC20 token standard.
2. MyOwnable - Version of 'Ownable' pattern but with many owners.
3. MyERC20Mint - Implementation of IERC20 functions and of mint functions that are not set by the standard.
4. MyERC20MintOwnable - As declared in the name, connection of 'MyOwnable' and 'MyERC20Mint' logic, the final contract.

*All contracts are provided with wide code documentation.*

In total, we get ERC20 token with next mint mechanism: one of the so-called owners can mint (a strictly set) amount of tokens after (a strictly set) period of time that passed after a last mint while current supply of tokens does not exceed (a strictly set) maximum supply. One of the owners can also prohibit mint at any time: after this no one will be able to mint tokens.

Owners, the amount of tokens to mint, period of time between mints, maximum supply - all of these are set individually when contract is deployed. After contract creation, all owners get initial tokens the amount of which equals the amount of tokens for usual mint.

And, of course, this token implements all ERC20 standard functions like "approve", "transfer", "balanceOf" and so on, so it's ready to interact with other tokens. Additionally, it is possible to set token name and symbol during construction of contract.
