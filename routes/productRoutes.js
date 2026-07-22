import express from 'express';
import { bulkUpdate, createProduct, deleteProduct, getAllProduct, getProductsByCategoryId, getSingleProduct, updateProduct } from '../controllers/productController.js';

const router=express.Router();

//get
router.get('/',getAllProduct);
router.get('/getProductsByCategoryId/:id',getProductsByCategoryId);
router.get('/:id',getSingleProduct);

//post
router.post('/',createProduct);
router.post('/bulkUpdate',bulkUpdate);

//patch
router.patch('/:id',updateProduct);

//delete
router.delete('/:id',deleteProduct);





export default router;