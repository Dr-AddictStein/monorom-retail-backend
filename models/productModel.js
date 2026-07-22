import mongoose, { Mongoose } from "mongoose";

const productSchema = new mongoose.Schema({
    name:{
        type: String
    },
    bannerImage:{
        type:String
    },
    productThumbnail:{
        type: String
    },
    galleryImages:[{
        type:String
    }],
    category:{
        type: String
    },
    price:{
        type: Number
    }, 
    priceBC:{
        type: Number
    }, 
    priceMC:{
        type: Number
    }, 
    priceSC:{
        type: Number
    }, 
    priceFC:{
        type: Number
    }, 
    specialLines:[{
        type: String 
    }],
    productCode:{
        type:String
    },
    youtubeURL:{
        type:String
    },
    desc:{
        type:String
    },
    stock:{
        type:Number
    },
    panicStock:{
        type:Number
    },
    hasOffer:{
        type:Boolean
    },
    offerTill:{
        type: String
    },
    offerPanicStarts:{
        type: String
    },
    orderCount:{
        type:Number,
        default:0
    }
},{timestamps:true});


const product = mongoose.model("ProductCollection", productSchema);

export default product;