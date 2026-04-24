import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("Web3EduBrasilTokens", async function () {
  const { viem } = await network.create();

  it("allows minter to mint and burner to burn", async function () {
    const [admin, minter, burner, user] = await viem.getWalletClients();

    const token = await viem.deployContract("Web3EduBrasilTokens", [
      admin.account.address,
      minter.account.address,
      burner.account.address,
    ]);

    await token.write.safeMint([user.account.address, "QmExampleMetadataCid"], {
      account: minter.account,
    });

    const tokenUri = await token.read.tokenURI([0n]);
    assert.equal(tokenUri, "ipfs://QmExampleMetadataCid");

    await token.write.burn([0n], { account: burner.account });

    await assert.rejects(async () => {
      await token.read.ownerOf([0n]);
    });
  });

  it("rejects mint from account without MINTER_ROLE", async function () {
    const [admin, minter, burner, user] = await viem.getWalletClients();

    const token = await viem.deployContract("Web3EduBrasilTokens", [
      admin.account.address,
      minter.account.address,
      burner.account.address,
    ]);

    await assert.rejects(async () => {
      await token.write.safeMint([user.account.address, "QmUnauthorized"], {
        account: user.account,
      });
    });
  });
});
