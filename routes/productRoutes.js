import express from 'express';
import { bulkUpdate, createProduct, deleteProduct, getAllProduct, getProductsByCategoryId, getSingleProduct, updateProduct } from '../controllers/productController.js';

const router=express.Router();

//get
router.get('/',getAllProduct);
router.get('/getProductsByCategoryId/:id',getProductsByCategoryId);

//post
router.post('/',createProduct);
router.post('/bulkUpdate',bulkUpdate);

router.get('/:id',getSingleProduct);

//patch
router.patch('/:id',updateProduct);

//delete
router.delete('/:id',deleteProduct);

export default router;
