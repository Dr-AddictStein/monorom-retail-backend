import mongoose, { Mongoose } from "mongoose";

const subCategorySchema = new mongoose.Schema({
    name:{
        type: String
    },
    slogan:{
        type: String
    },
    bannerImage:{
        type:String
    },
    subCategoryThumbnail:{
        type: String
    },
    products:[{
        type: String
    }],
    subSubCategories:[{
        type: String
    }],
    category:{
        type: String
    }
},{timestamps:true});


const subCategory = mongoose.model("SubCategoryCollection", subCategorySchema);

export default subCategory;