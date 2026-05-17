

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Web3EduBrasilTokens is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    uint256 private _nextTokenId;
    mapping(bytes32 => bool) private _trailMinted;

    constructor(address defaultAdmin, address minter, address burner) ERC721("Web3EduBrasil", "W3EB") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(BURNER_ROLE, burner);
        _grantRole(MINTER_ROLE, minter);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function safeMint(address to, string memory uri, bytes32 trailHash)
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        require(!_trailMinted[trailHash], "TRAIL_ALREADY_MINTED");
        _trailMinted[trailHash] = true;
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function hasTrailMinted(bytes32 trailHash) public view returns (bool) {
        return _trailMinted[trailHash];
    }

    function burn(uint256 id) public onlyRole(BURNER_ROLE) {
        _burn(id);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
