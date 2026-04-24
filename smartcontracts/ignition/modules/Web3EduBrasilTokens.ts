import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Web3EduBrasilTokensModule", (m) => {
  const defaultDeployer = m.getAccount(0);
  const defaultAdmin = m.getParameter("defaultAdmin", defaultDeployer);
  const minter = m.getParameter("minter", defaultDeployer);
  const burner = m.getParameter("burner", defaultDeployer);

  const web3EduBrasilTokens = m.contract("Web3EduBrasilTokens", [
    defaultAdmin,
    minter,
    burner,
  ]);

  return { web3EduBrasilTokens };
});
