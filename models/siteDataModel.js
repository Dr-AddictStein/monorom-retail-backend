import mongoose, { Mongoose } from "mongoose";

const siteDataSchema = new mongoose.Schema({
    logo: {
        type: String //image URL
    },
    homeBanner: {
        type: String //image URL
    },
    homeSlogan: {
        type: String 
    },
    homeSmallText: {
        type: String 
    },
    loginBanner: {
        type: String 
    },
    signUpBanner: {
        type: String 
    },
    aboutUs: {
        type: String
    },
    termsOfUse: {
        type: String
    },
    privacyPolicy: {
        type: String
    },
    cookiePolicy: {
        type: String
    },
    seoTitle: {
        type: String,
        default: "",
    },
    seoDescription: {
        type: String,
        default: "",
    },
    contactEmail: {
        type: String,
        default: "",
    },
    contactPhone: {
        type: String,
        default: "",
    },
    contactAddress: {
        type: String,
        default: "",
    },
}, { timestamps: true });


const siteData = mongoose.model("siteDataCollection", siteDataSchema);

export default siteData;