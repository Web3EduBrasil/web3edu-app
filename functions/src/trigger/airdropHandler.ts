// src/handlers/airdropHandler.js

import { onDocumentWritten, FirestoreEvent, DocumentSnapshot, Change } from "firebase-functions/v2/firestore";
import { runContract } from "../utils/wallet";
import { updateAirdropStatus } from "../utils/firestoreScripts";

export const airdropNFT = onDocumentWritten(
    {
        document: "whitelist/{uid}",
        secrets: ["CONTRACT_ADDRESS", "PRIVATE_KEY", "RPC_URL"],
    },
    async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { uid: string }>) => {
        // Obtenha o documento atualizado
        if (!event.data) {
            console.error("Event data is undefined");
            return;
        }
        const newValue = event.data.after.data();
        const uid = event.params.uid;

        const airdropCategories = newValue?.status ?? {};

        const contractAddress = process.env.CONTRACT_ADDRESS;
        const privateKey = process.env.PRIVATE_KEY;
        const rpcUrl = process.env.RPC_URL;

        if (!contractAddress || !privateKey || !rpcUrl) {
            throw new Error(
                "Missing required environment variables: CONTRACT_ADDRESS, PRIVATE_KEY, or RPC_URL"
            );
        }

        // Itera sobre cada categoria de airdrop no campo 'status'
        for (const category in airdropCategories) {
            const airdrop = airdropCategories[category];

            // Verifica se o usuário é elegível e o NFT ainda não foi mintado
            if (airdrop.eligible && !airdrop.minted) {
                try {
                    const walletAddress = newValue?.address;
                    const ipfsHash = airdrop.ipfsHash;
                    const tokenURI = ipfsHash.startsWith("ipfs://") ? ipfsHash : `ipfs://${ipfsHash}`;

                    const contract = runContract(contractAddress, privateKey, rpcUrl);

                    // Executa o mint no contrato com walletAddress e tokenURI
                    const tx = await contract.safeMint(walletAddress, tokenURI);
                    await tx.wait();

                    // Atualiza o status do airdrop para mintado e define o txHash
                    await updateAirdropStatus(uid, category, true, tx.hash);

                    console.log(`Airdrop bem-sucedido para usuário ${uid} na categoria ${category} - Tx: ${tx.hash}`);
                } catch (error) {
                    console.error(`Erro no airdrop para usuário ${uid} na categoria ${category}:`, error);
                    // NÃO re-escreve no Firestore para evitar loop infinito de triggers.
                    // O documento permanece com eligible:true, minted:false para a próxima tentativa.
                }
            }
        }
    }
);
