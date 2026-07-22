import express from 'express';
import { addToCart, buyNow, deleteCart, getCartByUserId } from '../controllers/cartController.js';

const router = express.Router();

router.post('/addToCart/:id', addToCart);
router.post('/buyNow/:id', buyNow);
router.get('/getCartByUserId/:id', getCartByUserId);
router.delete('/:id', deleteCart);

export default router;
