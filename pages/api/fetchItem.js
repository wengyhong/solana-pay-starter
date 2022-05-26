import products from './products.json'

export default async function handler(req,res){
    if(req.method === 'POST')
    {

        const {itemID } = req.body;

        if(!itemID){
            res.status(400).send("Missing ID");
        }

        for(let i=0; i<products.length; i++){

            console.log(i);
            let found = false;

            if(products[i].id === itemID){
                const {hash, fileName} = products[i]
                found = true;
                res.status(200).send({hash, fileName});
                break;
            }

            if(i === products.length -1 && !found)
            {
                res.status(404).send('item not found');

            }
        }
    }
    else{
        res.status(405).send(`Method ${req.method} not allowed`);
    }
}