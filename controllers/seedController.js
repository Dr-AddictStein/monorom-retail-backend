import productModel from "../models/productModel.js";


export const seed = async (req, res) => {
    
    // const products = await productModel.find({});
    // for(let i = 0; i < products.length; i++){
    //     products[i].orderCount = 0;
    //     await products[i].save();
    // }

    res.status(200).json({message:"Seed completed successfully"})
}