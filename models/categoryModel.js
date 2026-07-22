import mongoose, { Mongoose } from "mongoose";

const categorySchema = new mongoose.Schema({
    name:{
        type: String
    },
    slogan:{
        type: String
    },
    bannerImage:{
        type:String
    },
    categoryThumbnail:{
        type: String
    },
    subCategories:[{
        type: String
    }]
},{timestamps:true});


const category = mongoose.model("CategoryCollection", categorySchema);

export default category;