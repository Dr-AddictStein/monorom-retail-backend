import mongoose, { Mongoose } from "mongoose";

const subSubCategorySchema = new mongoose.Schema({
    name:{
        type: String
    },
    category:{
        type: String
    },
    subCategory:{
        type: String
    },
},{timestamps:true});


const subSubCategory = mongoose.model("SubSubCategoryCollection", subSubCategorySchema);

export default subSubCategory;