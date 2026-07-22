import siteDataModel from '../models/siteDataModel.js'; // Adjust this path if necessary
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

// Helper function to ensure site data exists
const ensureSiteDataExists = async () => {
    let data = await siteDataModel.findOne({});
    if (!data) {
        data = await siteDataModel.create({
            logo: "",
            homeBanner: "",
            homeSlogan: "",
            homeSmallText: "",
            loginBanner: "",
            signUpBanner: ""
        });
    }
    return data;
};

// Get Site Data
export const getSiteData = async (req, res) => {

    


    try {
        const data = await ensureSiteDataExists();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching site data", error });
    }
};

// Update Logo
export const updateLogo = async (req, res) => {
    try {
        await ensureSiteDataExists();
        const updatedData = await siteDataModel.findOneAndUpdate(
            {},
            { logo: req.body.logo },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        return res.status(500).json({ message: "Error updating logo", error });
    }
};

// Update Home Banner
export const updateHomeBanner = async (req, res) => {
    try {
        await ensureSiteDataExists();
        const updatedData = await siteDataModel.findOneAndUpdate(
            {},
            { homeBanner: req.body.homeBanner },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        return res.status(500).json({ message: "Error updating home banner", error });
    }
};

// Update Home Slogan
export const updateHomeSlogan = async (req, res) => {
    try {
        await ensureSiteDataExists();
        const updatedData = await siteDataModel.findOneAndUpdate(
            {},
            { homeSlogan: req.body.homeSlogan },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        return res.status(500).json({ message: "Error updating home slogan", error });
    }
};

// Update Home Small Text
export const updateHomeSmallText = async (req, res) => {
    try {
        await ensureSiteDataExists();
        const updatedData = await siteDataModel.findOneAndUpdate(
            {},
            { homeSmallText: req.body.homeSmallText },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        return res.status(500).json({ message: "Error updating home small text", error });
    }
};


// Update Login Banner
export const updateLoginBanner = async (req, res) => {
    try {
        await ensureSiteDataExists();
        const updatedData = await siteDataModel.findOneAndUpdate(
            {},
            { loginBanner: req.body.loginBanner },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        return res.status(500).json({ message: "Error updating Login Banner", error });
    }
};


// Update SignUp Banner
export const updateSignUpBanner = async (req, res) => {
    try {
        await ensureSiteDataExists();
        const updatedData = await siteDataModel.findOneAndUpdate(
            {},
            { signUpBanner: req.body.signUpBanner },
            { new: true }
        );
        return res.status(200).json(updatedData);
    } catch (error) {
        return res.status(500).json({ message: "Error updating SignUp Banner", error });
    }
};
