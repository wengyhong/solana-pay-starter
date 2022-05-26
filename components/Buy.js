import React,{ useEffect, useState, useMemo }  from "react"
import {Keypair, Transaction} from '@solana/web3.js'
import {useConnection, useWallet} from '@solana/wallet-adapter-react'
import { InfinitySpin } from "react-loader-spinner"
import IPFSDownload from "./IpfsDownload"
import { findReference, FindReferenceError } from "@solana/pay"
import {addOrder, hasOrder, fetchItem} from '../lib/api'

const STATUS = {
    Initial : "Initial",
    Submitted : "Submitted",
    Paid : "Paid"
};

export default function Buy({itemID}){

    console.log(itemID);
    const {connection} = useConnection();
    const {publicKey, sendTransaction} = useWallet();

    const orderID = useMemo(()=> Keypair.generate().publicKey, []);
    const [item, setItem] = useState(null); // IPFS hash & filename of the purchased item

    const [loading,setLoading] = useState(false);
    const [status, setStatus] = useState(STATUS.Initial)

    const order = useMemo(()=>({

        buyer:publicKey.toString(),
        orderID:orderID.toString(),
        itemID: itemID
    }), [publicKey, orderID, itemID]);


    const processTransaction = async()=>{

        setLoading(true);

        const txResponse =  await fetch('/api/createTransaction', {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(order),
          });

          console.log(txResponse);

        const txData = await txResponse.json();

        console.log(txData);

        const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));

        console.log(tx);


        try{
            const txHash = await sendTransaction(tx, connection);
            setStatus(STATUS.Submitted);
        }catch(error){
            console.log(error);
        } finally{
            setLoading(false);
        }
    }

    useEffect(()=>{
        async function checkPurchase(){
            const purchased = await hasOrder(publicKey, itemID);

            if(purchased){
                setStatus(STATUS.Paid)
                console.log("already has this item")
                const item = await fetchItem(itemID);
                console.log(item)
                setItem(item);
            }
        }

        checkPurchase();
    },[publicKey, itemID])

    useEffect(()=>{
        if(status === STATUS.Submitted){
            setLoading(true);
            const interval = setInterval(async()=>{
                try{
                    const result = await findReference(connection, orderID);

                    if(result.confirmationStatus === "confirmed"|| result.confirmationStatus === "finalized")
                    {
                        clearInterval(interval);
                        setStatus(STATUS.Paid);
                        setLoading(false);
                        addOrder(order);
                        alert("Thank you for your purchase")
                    }

                }
                catch(e){
                    if( e instanceof FindReferenceError){
                        return null
                    }
                    console.error("Unknown error", e);
                } finally {
                  setLoading(false);
                }
            }, 1000);

            return ()=>{
                clearInterval(interval)
            }
        }

        async function getItem(itemID) {
            const item = await fetchItem(itemID);
            setItem(item);

            console.log(item);
          }

          if (status === STATUS.Paid) {
            getItem(itemID);
            console.log(itemID)
          }
    }, [status])

    if(!publicKey){
        return(
            <div>
                <p>You need to connect your walelt</p>
            </div>
        )
    }

    if(loading)
    {
        return <InfinitySpin color="grey"/>
    }


    return (
        <div>
            {item? (
                <IPFSDownload fileName={item.fileName} hash={item.hash}/>
                            ):
            <button disabled={loading} className="buy-button" onClick={processTransaction}> BuyNow</button>}
        </div>
    )
}