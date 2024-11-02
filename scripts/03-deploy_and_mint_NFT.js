const tokenURI = "ipfs://QmawxKG8sEu4LkTxt3xhEY9EFeC94ekwWVX3DBec616fo5"

const { network, ethers } = require("hardhat")

async function deployNFTcontract() {
  const [owner] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", owner.address)
  const Pistilo_NFT = await ethers.getContractFactory("Pistilo_NFT")
  const pistilo_NFT = await Pistilo_NFT.deploy()
  const contractaddress = await pistilo_NFT.getAddress()
  console.log("Pistillo10 deployed to:", contractaddress)

  const tx = await pistilo_NFT.mintNFT(tokenURI)
  await tx.wait(1)
  console.log("minted: ", tokenURI)
  const tokenId = await pistilo_NFT.getTokenCounter()
  console.log("tokenId: ", tokenId.toString())

  return { contractaddress }
}

async function main() {
  const contractAddress = await deployNFTcontract()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
