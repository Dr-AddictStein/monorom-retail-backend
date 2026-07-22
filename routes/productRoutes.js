import express from 'express';
import { bulkUpdate, createProduct, deleteProduct, getAllProduct, getProductsBySubCategoryId, getSingleProduct, updateProduct } from '../controllers/productController.js';

const router=express.Router();

//get
router.get('/',getAllProduct);
router.get('/:id',getSingleProduct);
router.get('/getProductsBySubCategoryId/:id',getProductsBySubCategoryId);

//post
router.post('/',createProduct);
router.post('/bulkUpdate',bulkUpdate);

//patch
router.patch('/:id',updateProduct);

//delete
router.delete('/:id',deleteProduct);





export default router;