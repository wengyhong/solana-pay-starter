import products from './products.json'

export default function handler(req,res){

    if(req.method === 'GET'){

        const productNoHashes = products.map((product)=>{

               const {hash, fileName, ...rest} = product;
               return rest;

        });

        res.status(200).json(productNoHashes);
    }else
    {
        res.status(500).send(`${req.method} not allowed`);
    }
}