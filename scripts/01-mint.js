const { ethers, getNamedAccounts } = require("hardhat")

async function pistiloMint(amount) {
  const [owner, addr1, addr2] = await ethers.getSigners()
  console.log(owner.address)
  const pistilo10 = await ethers.getContractAt("Pistilo10", owner.address)
  console.log("about to mint...")
  const tx = await pistilo10.mintTokens(amount)
  await tx.wait(1)
  console.log("minted: ", amount)
}

pistiloMint(1000)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
