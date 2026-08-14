import express from 'express';
import { getSiteData, updateHomeBanner, updateHomeSlogan, updateHomeSmallText, updateLoginBanner, updateLogo, updatePageContent, updateSignUpBanner } from '../controllers/siteDataController.js';



const router=express.Router();


// get
router.get('/getSiteData',getSiteData);

// update
router.patch('/updateLogo',updateLogo);
router.patch('/updateHomeBanner',updateHomeBanner);
router.patch('/updateHomeSlogan',updateHomeSlogan);
router.patch('/updateHomeSmallText',updateHomeSmallText);
router.patch('/updateSignUpBanner',updateSignUpBanner);
router.patch('/updateloginBanner',updateLoginBanner);
router.patch('/updatePageContent',updatePageContent);






export default router;