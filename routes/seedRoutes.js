import express from 'express';
import { seed } from '../controllers/seedController.js';


const router=express.Router();


// post
router.post('/',seed);




export default router;