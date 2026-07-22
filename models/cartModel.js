import mongoose, { Mongoose } from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    productId: {
        type: String
    },
    qty:{
        type:Number
    }
}, { timestamps: true });


const cart = mongoose.model("CartCollection", cartSchema);

export default cart;