import express from 'express';
import { createCategory, deleteCategory, getAllCategory, getSingleCategory, homePageData, updateCategory } from '../controllers/categoryController.js';

const router=express.Router();

//get
router.get('/',getAllCategory);
router.get('/homePageData',homePageData);
router.get('/:id',getSingleCategory);

//post
router.post('/',createCategory);

//patch
router.patch('/:id',updateCategory);

//delete
router.delete('/:id',deleteCategory);





export default router;