import {
    clusterApiUrl,
    LAMPORTS_PER_SOL,
    Connection,
    PublicKey,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import {
    WalletAdapterNetwork
} from "@solana/wallet-adapter-base";
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token";

import BigNumber from "bignumber.js";
import products from './products.json'
const usdcAddress = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

const sellerAddress = '571ZxrQ2rwBq3A2TXjb6Us2xF2mGHoVRMsx9eWSDNukM'
const sellerPublicKey = new PublicKey(sellerAddress);

const createTransaction = async (req, res) => {
    try {

        const {
            buyer,
            orderID,
            itemID
        } = req.body;

        if (!buyer) {
            res.status(400).json({
                message: "Missing buyer address"
            })
        }

        if (!orderID) {
            res.status(400).json({
                message: "Missing order ID"
            })
        }


        const itemPrice = products.find((item) => itemID === item.id).price;


        if (!itemPrice) {
            res.status(400).json({
                message: "Missing item"
            })
        }

        const bigAmount = BigNumber(itemPrice);
        const buyerPublicKey = new PublicKey(buyer);
        const network = WalletAdapterNetwork.Devnet;
        const endpoint = clusterApiUrl(network);
        const connection = new Connection(endpoint);

        const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey);
        const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, sellerPublicKey);

        const {
            blockhash
        } = await connection.getLatestBlockhash("finalized");

            const usdcMint = await getMint(connection, usdcAddress);

        const tx = new Transaction({
            recentBlockhash: blockhash,
            feePayer: buyerPublicKey,
          });

        console.log(tx);

        // const instruction = SystemProgram.transfer({
        //     fromPubkey: buyerPublicKey,
        //     toPubkey: sellerPublicKey,
        //     lamports: bigAmount.multipliedBy(LAMPORTS_PER_SOL).toNumber()
        // })

        // const instruction = createTransferCheckedInstruction(
        //     buyerUsdcAddress,
        //     usdcAddress,
        //     shopUsdcAddress,
        //     buyerPublicKey,
        //     bigAmount.toNumber() * 10 ** (await usdcMint).decimals,
        //     usdcMint.decimals
        // )

        const instruction = createTransferCheckedInstruction(
            buyerUsdcAddress,
            usdcAddress,     // This is the address of the token we want to transfer
            shopUsdcAddress,
            buyerPublicKey,
            bigAmount.toNumber() * 10 ** (await usdcMint).decimals,
            usdcMint.decimals // The token could have any number of decimals
          );

        instruction.keys.push({
            pubkey: new PublicKey(orderID),
            isSigner: false,
            isWritable: false
        })

        tx.add(instruction);

        console.log(tx);

        const serializedTransaction = tx.serialize({
            requireAllSignatures: false
        });

        const base64 = serializedTransaction.toString("base64");

        res.status(200).json({
            transaction: base64
        })


    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: "error creating tx"
        });
        return;
    }


}

export default function handler(req, res) {

    if (req.method === 'POST') {
        createTransaction(req, res);
    } else {
        res.status(405).end();
    }
}

