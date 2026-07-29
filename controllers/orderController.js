import userModel from "../models/userModel.js";
import productModel from '../models/productModel.js';
import cartModel from "../models/cartModel.js";
import orderModel from "../models/orderModel.js";
import categoryModel from "../models/categoryModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";


export const createOrder = async (req, res) => {
    try {
        const data = {
            ...req.body
        };

        const newOrder = new orderModel(data);
        const savedOrder = await newOrder.save();

        for (let i = 0; i < (data.cartData || []).length; i++) {
            const prod = await productModel.findById(data.cartData[i].productId);
            if (!prod) continue;
            await productModel.findByIdAndUpdate(
                { _id: prod._id },
                {
                    stock: Math.max(0, prod.stock - data.cartData[i].qty),
                    orderCount: (prod.orderCount || 0) + 1,
                }
            );
        }

        // Only clear server-side cart when a real logged-in userId exists
        if (req.body.userId && req.body.userId !== "guest") {
            const cart = await cartModel.find({ userId: req.body.userId });
            let cnt = cart.length;
            while (cnt--) {
                await cartModel.findOneAndDelete({ userId: req.body.userId });
            }
        }

        return res.status(200).json(savedOrder);
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: error.message });
    }
}

export const getAllReceivedOrders = async (req, res) => {
    const orders = await orderModel.find({ status: "received" }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
}
export const getAllCompeltedOrders = async (req, res) => {
    const orders = await orderModel.find({ status: "completed" }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
}
export const myOrders = async (req, res) => {
    const { id } = req.params;
    const orders = await orderModel.find({ userId: id }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
}

export const getOrderDetailsByAdmin = async (req, res) => {
    const { id } = req.params;
    const order = await orderModel.findById(id);
    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    let userData = null;
    if (order.userId && order.userId !== "guest" && mongoose.Types.ObjectId.isValid(order.userId)) {
        userData = await userModel.findById(order.userId);
    }

    const data = {
        userName: order.name
            ? order.name
            : userData
              ? userData.firstName + " " + userData.lastName
              : "Guest",
        companyName: (order.companyName) ? order.companyName : "",
        city: userData ? userData.city : "",
        phone: order.phone,
        email: order.email,
        shippingAddress: order.address,
        totalCost: order.totalCost,
        products: order.cartData,
        status: order.status,
        createdAt: order.createdAt,
        requirements: order.requirements ? order.requirements : ""
    }

    return res.status(200).json(data);
}

export const markAsCompleted = async (req, res) => {
    const { id } = req.params;

    let dex = await orderModel.findById(id);

    dex.status = 'completed';

    const data = await orderModel.findByIdAndUpdate({ _id: id }, { ...dex });

    return res.status(200).json(data);
}


export const deleteOrder = async (req, res) => {
    const { id } = req.params;

    const ord = await orderModel.findById(id);

    for (let i = 0; i < ord.cartData.length; i++) {
        const prod = await productModel.findById(ord.cartData[i].productId);
        if (prod) await productModel.findByIdAndUpdate({ _id: prod._id }, { stock: prod.stock + ord.cartData[i].qty, orderCount: prod.orderCount - 1 });
    }

    const data = await orderModel.findByIdAndDelete({ _id: id });

    return res.status(200).json(data);
}
