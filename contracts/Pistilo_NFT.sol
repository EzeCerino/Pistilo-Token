//SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Pistilo_NFT is ERC721, ERC721URIStorage, Ownable {
    constructor() ERC721("Pistilo_NFT", "P_NFT") Ownable(msg.sender) {}

    uint256 private s_tokenCounter;

    function mintNFT(string memory _tokenURI) public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        _setTokenURI(s_tokenCounter, _tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(_tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
