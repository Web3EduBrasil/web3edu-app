import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Web3eduBrasilTokens } from "../target/types/web3edu_brasil_tokens";

// TODO Phase 6 — add tests
describe("web3edu-brasil-tokens", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Web3eduBrasilTokens as Program<Web3eduBrasilTokens>;

  it("placeholder", async () => {});
});
