import mongoose, { Mongoose } from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    name:{
        type:String
    },
    email:{
        type:String
    },
    phone:{
        type:String
    },
    address:{
        type:String
    },
    totalCost:{
        type:Number
    },
    cartData: [Object],
    status:{
        type:String
    },
    companyName:{
        type: String
    },
    requirements:{
        type: String
    }
}, { timestamps: true });


const order = mongoose.model("OrderCollection", orderSchema);

export default order;