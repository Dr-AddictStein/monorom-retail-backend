import express from 'express';
import { createSubSubCategory, deleteSubSubCategory, getAllSubSubCategory, getSingleSubSubCategory, subSubCategoryBySubCategoryID, updateSubSubCategory } from '../controllers/subSubCategoryController.js';

const router=express.Router();

//get
router.get('/',getAllSubSubCategory);
router.get('/:id',getSingleSubSubCategory);
router.get('/subSubCategoryBySubCategoryID/:id',subSubCategoryBySubCategoryID);

//post
router.post('/',createSubSubCategory);

//patch
router.patch('/:id',updateSubSubCategory);

// delete
router.delete('/:id',deleteSubSubCategory);





export default router;