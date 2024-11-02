const tokenURI = "ipfs://QmawxKG8sEu4LkTxt3xhEY9EFeC94ekwWVX3DBec616fo5"
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
const { network, ethers } = require("hardhat")

async function mintNFT() {
  console.log(contractAddress)
  const [owner] = await ethers.getSigners()
  const pistilo_NFT = await ethers.getContractAt("Pistilo_NFT", contractAddress)
  const tx = await pistilo_NFT.connect(owner).mintNFT(tokenURI)
  await tx.wait(1)
  const tokenId = await pistilo_NFT.getTokenCounter()
  console.log("tokenId: ", tokenId.toString())
  console.log("minted: ", tokenURI)
}

mintNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
