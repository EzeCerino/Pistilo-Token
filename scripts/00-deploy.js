const { network, ethers } = require("hardhat")

async function deploycontract() {
  const [owner] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", owner.address)
  const args = ["pistilo10", "P10"]
  const Pistilo10 = await ethers.getContractFactory("Pistilo10")
  const pistilo10 = await Pistilo10.deploy("Pistilo10", "P10")
  const contractaddress = await pistilo10.getAddress()
  console.log("Pistillo10 deployed to:", contractaddress)
}

deploycontract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
