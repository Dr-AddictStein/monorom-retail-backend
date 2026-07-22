import express from 'express';
import { createOrder, deleteOrder, getAllCompeltedOrders, getAllReceivedOrders, getOrderDetailsByAdmin, markAsCompleted, myOrders } from '../controllers/orderController.js';


const router=express.Router();


// post
router.post('/createOrder',createOrder);

// get
router.get('/getAllReceivedOrders',getAllReceivedOrders);
router.get('/getAllCompeltedOrders',getAllCompeltedOrders);
router.get('/getOrderDetailsByAdmin/:id',getOrderDetailsByAdmin);
router.get('/myOrders/:id',myOrders);

// update
router.patch('/markAsCompleted/:id',markAsCompleted);

// delete
router.delete('/deleteOrder/:id',deleteOrder);



export default router;