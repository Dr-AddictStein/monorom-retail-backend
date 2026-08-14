import mongoose from "mongoose";

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
    homeAddress:{
        type:String
    },
    thana:{
        type:String
    },
    district:{
        type:String
    },
    deliveryPlace:{
        type:String,
        enum: ["inside_dhaka", "outside_dhaka"]
    },
    deliveryCharge:{
        type:Number,
        default: 0
    },
    subtotal:{
        type:Number
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
