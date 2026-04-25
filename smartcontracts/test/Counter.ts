import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe.skip("Counter", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  it("Should emit the Increment event when calling the inc() function", async function () {
    const counter = await viem.deployContract("Counter");
    const txHash = await counter.write.inc();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const events = await publicClient.getContractEvents({
      address: counter.address,
      abi: counter.abi,
      eventName: "Increment",
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    assert.equal(events.length, 1);
    assert.equal((events[0]?.args as { by?: bigint })?.by, 1n);
  });

  it("The sum of the Increment events should match the current value", async function () {
    const counter = await viem.deployContract("Counter");
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    // run a series of increments
    for (let i = 1n; i <= 10n; i++) {
      await counter.write.incBy([i]);
    }

    const events = await publicClient.getContractEvents({
      address: counter.address,
      abi: counter.abi,
      eventName: "Increment",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    // check that the aggregated events match the current value
    let total = 0n;
    for (const event of events) {
      total += (event.args as { by?: bigint })?.by ?? 0n;
    }

    assert.equal(total, await counter.read.x());
  });
});
