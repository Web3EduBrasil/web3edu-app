// src/handlers/airdropHandler.js

import { onDocumentWritten, FirestoreEvent, DocumentSnapshot, Change } from "firebase-functions/v2/firestore";
import { runContract } from "../utils/wallet";
import {
    updateAirdropStatus,
    updateAirdropTerminalFailureStatus,
    TerminalErrorCode,
} from "../utils/firestoreScripts";

function classifyTerminalError(error: unknown): { errorCode: TerminalErrorCode; errorMessage: string } {
    const err = error as {
        message?: string;
        shortMessage?: string;
        reason?: { message?: string };
    };

    const rawMessage =
        err?.reason?.message ||
        err?.shortMessage ||
        err?.message ||
        "Unknown mint error";

    const sanitizedMessage = rawMessage.replace(/\s+/g, " ").trim().slice(0, 300);
    const normalizedMessage = sanitizedMessage.toLowerCase();

    if (/(accesscontrol|missing role|minter_role|not authorized|unauthorized|permission)/i.test(normalizedMessage)) {
        return { errorCode: "ACCESS_CONTROL", errorMessage: sanitizedMessage };
    }

    if (/(invalid address|unsupported addressable value|bad address checksum|invalid argument.*address)/i.test(normalizedMessage)) {
        return { errorCode: "INVALID_ADDRESS", errorMessage: sanitizedMessage };
    }

    if (/(rpc|network|timeout|timed out|429|rate limit|could not coalesce error|socket|connection|econn|etimedout)/i.test(normalizedMessage)) {
        return { errorCode: "RPC_ERROR", errorMessage: sanitizedMessage };
    }

    return { errorCode: "UNKNOWN", errorMessage: sanitizedMessage || "Unknown mint error" };
}

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

        const missingSecrets = !contractAddress || !privateKey || !rpcUrl;
        if (missingSecrets) {
            const errorMessage = "Missing required function secrets for minting";
            console.error(errorMessage);

            for (const category in airdropCategories) {
                const airdrop = airdropCategories[category];
                if (airdrop?.eligible && !airdrop?.minted && !airdrop?.terminalError) {
                    await updateAirdropTerminalFailureStatus(uid, category, "UNKNOWN", errorMessage);
                }
            }
            return;
        }

        // Itera sobre cada categoria de airdrop no campo 'status'
        for (const category in airdropCategories) {
            const airdrop = airdropCategories[category];

            // Verifica se o usuário é elegível e o NFT ainda não foi mintado
            if (airdrop.eligible && !airdrop.minted && !airdrop.terminalError) {
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
                    const { errorCode, errorMessage } = classifyTerminalError(error);
                    await updateAirdropTerminalFailureStatus(uid, category, errorCode, errorMessage);
                }
            }
        }
    }
);
