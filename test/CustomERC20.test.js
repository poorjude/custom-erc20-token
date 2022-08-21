const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("My ERC20 token", function() {
    async function deployToken() { // With small interval between mints
        [acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners();

        const name_ = "PoorJudeToken";
        const symbol_ = "PJTKN";
        const maxSupply_ = 1_000_000;
        const amountToMint_ = 500;
        const intervalOfMint_ = 1; // Such interval is set because of testing issues
        const additionalOwners_ = [acc2.address, acc3.address];
    
        const tokenFactory = await ethers.getContractFactory("MyERC20MintOwnable");
        const token = await tokenFactory.deploy(name_, symbol_, maxSupply_, amountToMint_, 
            intervalOfMint_, additionalOwners_);
    
        await token.deployed();

        owners = [acc1, acc2, acc3];
        nonOwners = [acc4, acc5];

        return { token, owners, nonOwners, 
            name_, symbol_, maxSupply_, amountToMint_, intervalOfMint_ };
    }

    async function deployTokenWithSmallMaxSup() { // With small maximum supply
        [acc1, acc2, acc3] = await ethers.getSigners();

        const name_ = "PoorJudeToken";
        const symbol_ = "PJTKN";
        const maxSupply_ = 1000; // Such supply is set because of test issues
        const amountToMint_ = 500;
        const intervalOfMint_ = 1;
        const additionalOwners_ = [];
    
        const tokenFactory = await ethers.getContractFactory("MyERC20MintOwnable");
        const token = await tokenFactory.deploy(name_, symbol_, maxSupply_, amountToMint_, 
            intervalOfMint_, additionalOwners_);
    
        await token.deployed();

        owners = [acc1];
        nonOwners = [acc2, acc3];

        return { token, owners, nonOwners, 
            name_, symbol_, maxSupply_, amountToMint_, intervalOfMint_ };
    }

    async function deployTokenWithLargeMintInt() { // With large mint interval
        [acc1, acc2, acc3] = await ethers.getSigners();

        const name_ = "PoorJudeToken";
        const symbol_ = "PJTKN";
        const maxSupply_ = 1_000_000;
        const amountToMint_ = 500;
        const intervalOfMint_ = 100000000; // Such interval is set because of test issues
        const additionalOwners_ = [];
    
        const tokenFactory = await ethers.getContractFactory("MyERC20MintOwnable");
        const token = await tokenFactory.deploy(name_, symbol_, maxSupply_, amountToMint_, 
            intervalOfMint_, additionalOwners_);
    
        await token.deployed();

        owners = [acc1];
        nonOwners = [acc2, acc3];

        return { token, owners, nonOwners, 
            name_, symbol_, maxSupply_, amountToMint_, intervalOfMint_ };
    }

    describe("Deployment", function() {
        it("Should be deployed", async function() {
            const { token } = await loadFixture(deployToken);
 
            expect(token.address).not.to.undefined;
        });

        it("Should set the right name of token", async function() {
            const { token, name_ } = await loadFixture(deployToken);

            expect(await token.tokenName()).to.equal(name_);
        });

        it("Should set the right symbol of the token", async function() {
            const { token, symbol_ } = await loadFixture(deployToken);
 
            expect(await token.tokenSymbol()).to.equal(symbol_);
        });

        it("Should set the right supply of the token", async function() {
            const { token, maxSupply_ } = await loadFixture(deployToken);
 
            expect(await token.maxSupply()).to.equal(maxSupply_);
        });

        it("Should set the right possible mint amount", async function() {
            const { token, amountToMint_ } = await loadFixture(deployToken);
 
            expect(await token.amountToMint()).to.equal(amountToMint_);
        });

        it("Should set the right interval of mint", async function() {
            const { token, intervalOfMint_ } = await loadFixture(deployToken);
 
            expect(await token.intervalOfMint()).to.equal(intervalOfMint_);
        });

        it("Should set the right owners of the contract", async function() {
            const { token, owners } = await loadFixture(deployToken);

            let ownersAddresses = await token.getOwners();

            for (let eachOwner of owners) {
                expect(ownersAddresses).to.include(eachOwner.address);
            }

            expect(ownersAddresses.length).to.equal(owners.length);
        });

        it("Should assign right amount of tokens to the owners", async function() {
            const { token, owners, amountToMint_ } = await loadFixture(deployToken);

            for (let eachOwner of owners) {
                expect(await token.balanceOf(eachOwner.address)).to.equal(amountToMint_);
            }
        });
    });

    describe("Standard ERC20 token methods", function() {
        describe("`totalSupply` method", function() {
            it("Should return correct supply of the token", async function() {
                const { token, owners, amountToMint_ } = await loadFixture(deployToken);

                let correctSupply = amountToMint_ * owners.length;
                expect(await token.totalSupply()).to.equal(correctSupply);

                await token.mint(owners[0].address);
                correctSupply += amountToMint_;
                expect(await token.totalSupply()).to.equal(correctSupply);
            });
        });

        describe("`transfer` method", function() {
            it("Should transfer tokens", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let from = owners[0].address;
                let to = owners[1].address;
                
                expect(token.transfer(to, 1))
                .to.changeTokenBalances(token, [from, to], [-1, 1]);

                [from, to] = [to, from];

                expect(token.connect(owners[1]).transfer(to, 2))
                .to.changeTokenBalances(token, [from, to], [-2, 2]);
            });

            it("Should emit `Transfer` event on transfers", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let from = owners[0].address;
                let to = owners[1].address;
                
                expect(token.transfer(to, 1)).to.emit(token, "Transfer");

                [from, to] = [to, from];

                expect(token.connect(owners[1]).transfer(to, 2)).to.emit(token, "Transfer");
            });

            it("Should revert if there is not enough tokens", async function() {
                const { token, nonOwners } = await loadFixture(deployToken);

                let from = nonOwners[0].address;
                let to = nonOwners[1].address;
                
                expect(token.transfer(to, 10000000))
                .to.be.revertedWith("MyERC20: Not enough tokens for `transfer`!");

                [from, to] = [to, from];

                expect(token.connect(owners[1]).transfer(to, 20000000))
                .to.be.revertedWith("MyERC20: Not enough tokens for `transfer`!");
            });
        });

        describe("`approve` and `transferFrom` methods", function() {
            it("Should approve tokens for transfer", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let amount = 200;
                
                await token.approve(spender, amount);

                expect(await token.allowance(approver, spender)).to.equal(amount);

                [approver, spender] = [spender, approver];
                amount = 400;

                await token.connect(owners[1]).approve(spender, amount);

                expect(await token.allowance(approver, spender)).to.equal(amount);
            });

            it("Should emit `Approval` event on approvals", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let amount = 200;
                
                expect(token.approve(spender, amount)).to.emit(token, "Approval");

                [approver, spender] = [spender, approver];
                amount = 400;

                expect(token.connect(owners[1]).approve(spender, amount)).to.emit(token, "Approval");
            });

            it("Should transfer approved tokens", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let amount = 200;
                
                await token.approve(spender, amount);

                expect(token.transferFrom(approver, spender, amount))
                .to.changeTokenBalances(token, [approver, spender], [-amount, amount]);

                [approver, spender] = [spender, approver];
                amount = 400;

                await token.connect(owners[1]).approve(spender, amount);

                expect(token.transferFrom(approver, spender, amount))
                .to.changeTokenBalances(token, [approver, spender], [-amount, amount]);
            });

            it("Should decrease amount of approved tokens after transfer", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let approvedAmount = 200;
                let amountToSpend = 100;
                
                await token.approve(spender, approvedAmount);
                await token.connect(owners[1]).transferFrom(approver, spender, amountToSpend);

                expect(await token.allowance(approver, spender))
                .to.equal(approvedAmount - amountToSpend);

                [approver, spender] = [spender, approver];
                approvedAmount = 400;
                amountToSpend = 200;

                await token.connect(owners[1]).approve(spender, approvedAmount);
                await token.transferFrom(approver, spender, amountToSpend);

                expect(await token.allowance(approver, spender))
                .to.equal(approvedAmount - amountToSpend);
            });

            it(`Shouldn't decrease amount of approved tokens
                    after transfer if amount was ~infinite~`, async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let approvedAmount = ethers.constants.MaxUint256;
                let amountToSpend = 100;
                
                await token.approve(spender, approvedAmount);
                await token.connect(owners[1]).transferFrom(approver, spender, amountToSpend);

                expect(await token.allowance(approver, spender))
                .to.equal(approvedAmount);

                [approver, spender] = [spender, approver];
                amountToSpend = 200;

                await token.connect(owners[1]).approve(spender, approvedAmount);
                await token.transferFrom(approver, spender, amountToSpend);

                expect(await token.allowance(approver, spender))
                .to.equal(approvedAmount);
            });

            it("Should revert if there is not enough approved tokens", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let amount = 200;
                
                await token.approve(spender, amount);

                expect(token.transferFrom(approver, spender, amount + 1))
                .to.be.revertedWith("MyERC20: Not enough approved tokens for `transferFrom`!");

                [approver, spender] = [spender, approver];
                amount = 400;

                await token.connect(owners[1]).approve(spender, amount);

                expect(token.transferFrom(approver, spender, amount + 2))
                .to.be.revertedWith("MyERC20: Not enough approved tokens for `transferFrom`!");
            });

            it("Should revert if there is not enough tokens on balance of approver", async function() {
                const { token, owners } = await loadFixture(deployToken);

                let approver = owners[0].address;
                let spender = owners[1].address;
                let amount = 20000000;
                
                await token.approve(spender, amount);

                expect(token.transferFrom(approver, spender, amount))
                .to.be.revertedWith("MyERC20: Not enough tokens for `transfer`!");

                [approver, spender] = [spender, approver];
                amount = 40000000;

                await token.connect(owners[1]).approve(spender, amount);

                expect(token.transferFrom(approver, spender, amount))
                .to.be.revertedWith("MyERC20: Not enough tokens for `transfer`!");
            });
        });
    });

    describe("Methods with access for owners only", function() {
        describe("`addOwner` method", function() {
            it("Should allow only owners to add new owners", async function() {
                const { token, owners, nonOwners } = await loadFixture(deployToken);
                
                let newOwner = nonOwners[0].address;
                await token.addOwner(newOwner);
    
                expect( (await token.getOwners())[owners.length] ).to.equal(newOwner);
            });
    
            it("Should not allow owners to make themselves owners again", async function() {
                const { token, owners } = await loadFixture(deployToken);
                
                let newOwner = owners[0].address;
    
                expect(token.addOwner(newOwner))
                .to.be.revertedWith("MyOwnable: This address is already an owner!");
            });
    
            it("Should not allow non-owners to add new owners", async function() {
                const { token, nonOwners } = await loadFixture(deployToken);
                
                let newOwner = nonOwners[0].address;
    
                expect(token.connect(nonOwners[0]).addOwner(newOwner))
                .to.be.revertedWith("MyOwnable: You are not one of the owners!");
            });
        });
        
        describe("`mint` method", function() {
            it("Should mint right amount of tokens to owners", async function() {
                const { token, owners, amountToMint_ } = await loadFixture(deployToken);
                
                let ownerAddress = owners[0].address;
    
                expect(token.mint(ownerAddress))
                .to.changeTokenBalance(token, ownerAddress, amountToMint_);
            });
    
            it("Should not allow non-owners to mint new tokens", async function() {
                const { token, nonOwners } = await loadFixture(deployToken);
    
                let nonOwner = nonOwners[0];
    
                expect(token.connect(nonOwner).mint(nonOwner.address))
                .to.be.revertedWith("MyOwnable: You are not one of the owners!");
            });

            it("Should not allow to mint new tokens if max supply is reached", async function() {
                const { token, owners, amountToMint_ } = await loadFixture(deployTokenWithSmallMaxSup);
                
                let ownerAddress = owners[0].address;
    
                expect(token.mint(ownerAddress))
                .to.changeTokenBalance(token, ownerAddress, amountToMint_);

                expect(token.mint(ownerAddress))
                .to.be.revertedWith("MyMint: You reached maximum supply!");
            });

            it("Should not allow to mint new tokens if time has not passed yet", async function() {
                const { token, owners, amountToMint_ } = await loadFixture(deployTokenWithLargeMintInt);
                
                let ownerAddress = owners[0].address;
    
                expect(token.mint(ownerAddress))
                .to.changeTokenBalance(token, ownerAddress, amountToMint_);

                expect(token.mint(ownerAddress))
                .to.be.revertedWith("MyMint: It is too early to mint yet!");
            });
        });

        describe("`prohibitMint` method", function() {
            it("Should allow owners to prohibit mint", async function() {
                const { token } = await loadFixture(deployToken);
                
                await token.prohibitMint();
    
                expect(await token.allowMint()).to.equal(false);
            });

            it("Should not allow mint after mint prohibiting", async function() {
                const { token } = await loadFixture(deployToken);
                
                await token.prohibitMint();
    
                expect(token.mint())
                .to.be.revertedWith("MyMint: Mint is not allowed anymore!");
            });

            it("Should not allow non-owners to prohibit mint", async function() {
                const { token, nonOwners } = await loadFixture(deployToken);
                
                expect(token.connect(nonOwners[0]).prohibitMint())
                .to.be.revertedWith("MyOwnable: You are not one of the owners!");
            });
        });
    });
})