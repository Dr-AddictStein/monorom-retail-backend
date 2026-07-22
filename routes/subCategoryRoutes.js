import express from 'express';
import { createSubCategory, deleteSubCategory, getAllSubCategory, getSingleSubCategory, getSubCategoriesByCategoryId, updateSubCategory } from '../controllers/subCategoryController.js';

const router=express.Router();

//get
router.get('/',getAllSubCategory);
router.get('/:id',getSingleSubCategory);
router.get('/getSubCategoriesByCategoryId/:id',getSubCategoriesByCategoryId);

//post
router.post('/',createSubCategory);

//patch
router.patch('/:id',updateSubCategory);

//delete
router.delete('/:id',deleteSubCategory);





export default router;