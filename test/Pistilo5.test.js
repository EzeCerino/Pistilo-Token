const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")

describe("Pistilo5", async () => {
  let owner
  let contract
  let addr1
  let addr2
  beforeEach(async () => {
    ;[owner, addr1, addr2] = await ethers.getSigners()
    const Pistilo10 = await ethers.getContractFactory("Pistilo10")
    contract = await Pistilo10.deploy("Pistilo10", "P10")
  })
  describe("constructor", async () => {
    it("sets name and symbol", async () => {
      assert.equal(await contract.name(), "Pistilo10")
      assert.equal(await contract.symbol(), "P10")
    })
    it("sets owner", async () => {
      assert.equal(await contract.owner(), owner.address)
    })
    it("sets balance to 0", async () => {
      assert.equal(await contract.balanceOf(owner.address), 0)
    })
    it("sets totalSupply to 0", async () => {
      assert.equal(await contract.totalSupply(), 0)
    })
  })

  describe("mintTokens", async () => {
    it("reverts if not called by owner", async () => {
      await expect(contract.connect(addr1).mintTokens(100)).to.be.reverted
    })
    it("reverts if amount is 0", async () => {
      await expect(contract.mintTokens(0)).to.be.reverted
    })
    it("emits an event", async () => {
      await expect(contract.mintTokens(100)).to.emit(
        contract,
        "Pistilo10__TokenMinted"
      )
    })
    it("increases totalSupply by amount", async () => {
      await contract.mintTokens(100)
      assert.equal(await contract.totalSupply(), 100)
    })
    it("mint and update the burnSheduleQueue", async () => {
      await expect(contract.mintTokens(100)).to.emit(
        contract,
        "Pistilo10__TokenMinted"
      )
      const burnSheduleQueue = await contract.getBurnSchedule(1)
      const newTimeStamp = await contract.getCurrentTimeStamp()
      assert.equal(burnSheduleQueue[0], 100)
      expect(Number(newTimeStamp)).to.be.closeTo(
        Number(burnSheduleQueue[1]),
        350
      )
      assert.equal(Number(burnSheduleQueue[2]), 0) /// Preguntar como funciona esta parte
      assert.equal(Number(burnSheduleQueue[3]), 1) /// Preguntar como funciona esta parte
    })
    it("mint with expired tokens", async () => {
      await contract.mintTokens(100)
      await contract.transfer(addr1.address, 10)
      await network.provider.send("evm_increaseTime", [400])
      await network.provider.send("evm_mine")
      await contract.burnExpiredTokens()
      assert.equal(await contract.balanceOf(owner.address), 0)
      assert.equal(await contract.balanceOf(addr1.address), 10)
      assert.equal(await contract.totalSupply(), 10)
      await contract.mintTokens(100)
      assert.equal(await contract.totalSupply(), 100)
      assert.equal(await contract.balanceOf(addr1.address), 10)
      assert.equal(await contract.balanceOf(owner.address), 90)
      const burnSheduleQueue = await contract.getBurnSchedule(2)
      const newTimeStamp = await contract.getCurrentTimeStamp()
      assert.equal(burnSheduleQueue[0], 100)
      expect(Number(newTimeStamp)).to.be.closeTo(
        Number(burnSheduleQueue[1]),
        350
      )
      assert.equal(Number(burnSheduleQueue[2]), 1) /// Preguntar como funciona esta parte
      assert.equal(Number(burnSheduleQueue[3]), 2) /// Preguntar como funciona esta parte
    })
    it("mint with expired tokens and the amount to mint is equal to the debt", async () => {
      await contract.mintTokens(100)
      await contract.transfer(addr1.address, 10)
      await network.provider.send("evm_increaseTime", [400])
      await network.provider.send("evm_mine")
      await contract.burnExpiredTokens()
      assert.equal(await contract.balanceOf(owner.address), 0)
      assert.equal(await contract.balanceOf(addr1.address), 10)
      assert.equal(await contract.totalSupply(), 10)
      await expect(contract.mintTokens(10)).to.emit(contract, "LogMessage")
      assert.equal(await contract.totalSupply(), 10)
    })
    it("mint with expired tokens and the amount to mint is less than the debt", async () => {
      await contract.mintTokens(1000)
      await contract.transfer(addr1.address, 100)
      await network.provider.send("evm_increaseTime", [400])
      await network.provider.send("evm_mine")
      await contract.burnExpiredTokens()
      assert.equal(await contract.balanceOf(owner.address), 0)
      assert.equal(await contract.balanceOf(addr1.address), 100)
      assert.equal(await contract.totalSupply(), 100)
      await contract.connect(addr1).transfer(owner.address, 100)
      await expect(contract.mintTokens(50)).to.emit(contract, "LogMessage")
      assert.equal(await contract.totalSupply(), 50)
      assert.equal(await contract.balanceOf(owner.address), 50)
      const burnSheduleQueue = await contract.getBurnSchedule(1)
      assert.equal(burnSheduleQueue[0], 50)
    })
    it("mint 3 times with no expired tokens", async () => {
      await contract.mintTokens(100)
      await contract.mintTokens(100)
      await expect(contract.mintTokens(100)).to.emit(
        contract,
        "Pistilo10__TokenMinted__total"
      )
      assert.equal(await contract.balanceOf(owner.address), 300)
      assert.equal(await contract.totalSupply(), 300)
    })
  })

  describe("Burn Expired Tokens", async () => {
    it("reverts if not called by owner", async () => {
      await expect(contract.connect(addr1).burnExpiredTokens()).to.be.reverted
    })
    it("reverts if there are no tokens to burn", async () => {
      await expect(contract.burnExpiredTokens()).to.be.reverted
    })
    it("require that the timestamp is greater than the expiry date", async () => {
      await contract.mintTokens(100)
      await expect(contract.burnExpiredTokens()).to.be.reverted
    })
    it("It burns if there is enough balance", async () => {
      await contract.mintTokens(100)
      // Avanzar el tiempo en 400 segundos
      await network.provider.send("evm_increaseTime", [400])
      // Minar un bloque para reflejar el cambio de tiempo
      await network.provider.send("evm_mine")
      await expect(contract.burnExpiredTokens()).to.emit(
        contract,
        "Pistilo10__token_Vencios"
      )
      assert.equal(await contract.balanceOf(owner.address), 0)
      const burnSheduleQueue = await contract.getBurnSchedule(1)
      assert.equal(burnSheduleQueue[2], 1)
    })
    it("It burns if there is enough balance, and only the first one", async () => {
      await contract.mintTokens(100)
      await network.provider.send("evm_increaseTime", [100])
      await network.provider.send("evm_mine")
      await contract.mintTokens(200)
      // Avanzar el tiempo en 400 segundos
      await network.provider.send("evm_increaseTime", [400])
      // Minar un bloque para reflejar el cambio de tiempo
      await network.provider.send("evm_mine")
      await contract.burnExpiredTokens()
      assert.equal(await contract.balanceOf(owner.address), 200)
      const burnSheduleQueue = await contract.getBurnSchedule(1)
      assert.equal(burnSheduleQueue[2], 1)
      assert.equal(await contract.totalSupply(), 200)
    })
    it("if ther is not enough balance, burn the amount of the owner", async () => {
      await contract.mintTokens(100)
      await contract.transfer(addr1.address, 10)
      await network.provider.send("evm_increaseTime", [400])
      await network.provider.send("evm_mine")
      await contract.burnExpiredTokens()
      assert.equal(await contract.balanceOf(owner.address), 0)
      assert.equal(await contract.balanceOf(addr1.address), 10)
      assert.equal(await contract.totalSupply(), 10)
      const burnSheduleQueue = await contract.getBurnSchedule(1)
      assert.equal(burnSheduleQueue[0], 10)
      assert.equal(burnSheduleQueue[2], 0)
    })
  })
})
