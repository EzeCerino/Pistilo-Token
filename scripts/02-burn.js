const { ethers, getNamedAccounts } = require("hardhat")

async function burnExpiredTokens() {
  const [owner] = await ethers.getSigners()
  const ownerAddress = owner.address
  //console.log(owner.address)
  const pistilo10 = await ethers.getContractAt("Pistilo10", ownerAddress)
  console.log("about to burn...")
  const tx = await pistilo10.burnExpiredTokens()
  await tx.wait(1)
  console.log("the tokens has been burned")
}

burnExpiredTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
