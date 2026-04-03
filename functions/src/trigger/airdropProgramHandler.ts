import { onDocumentWritten, FirestoreEvent, DocumentSnapshot, Change } from "firebase-functions/v2/firestore";
import { runContract } from "../utils/wallet";
import { updateProgramAirdropStatus } from "../utils/firestoreScripts";

/**
 * Cloud Function disparada quando um documento em programWhitelist/{uid} é criado ou atualizado.
 * Para cada programa com eligible: true e minted: false, faz o mint do NFT de certificado.
 */
export const airdropProgramNFT = onDocumentWritten(
  {
    document: "programWhitelist/{uid}",
    secrets: ["CONTRACT_ADDRESS", "PRIVATE_KEY", "RPC_URL"],
  },
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { uid: string }>) => {
    if (!event.data) {
      console.error("Event data is undefined");
      return;
    }

    const newValue = event.data.after.data();
    const uid = event.params.uid;
    const programCategories = newValue?.status ?? {};

    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!contractAddress || !privateKey || !rpcUrl) {
      throw new Error(
        "Missing required environment variables: CONTRACT_ADDRESS, PRIVATE_KEY, or RPC_URL"
      );
    }

    for (const programId in programCategories) {
      const airdrop = programCategories[programId];

      if (airdrop.eligible && !airdrop.minted) {
        try {
          const walletAddress = newValue?.address;
          const ipfsHash = airdrop.ipfsHash;
          const tokenURI = ipfsHash.startsWith("ipfs://") ? ipfsHash : `ipfs://${ipfsHash}`;
          const contract = runContract(contractAddress, privateKey, rpcUrl);

          const tx = await contract.safeMint(walletAddress, tokenURI);
          await tx.wait();

          await updateProgramAirdropStatus(uid, programId, true, tx.hash);
          console.log(
            `Certificado de programa mintado com sucesso para usuário ${uid}, programa ${programId} - Tx: ${tx.hash}`
          );
        } catch (error) {
          console.error(
            `Erro ao mintar certificado de programa para usuário ${uid}, programa ${programId}:`,
            error
          );
          // NÃO re-escreve para evitar loop infinito de triggers.
        }
      }
    }
  }
);
