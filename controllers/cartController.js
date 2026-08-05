import userModel from "../models/userModel.js";
import productModel from '../models/productModel.js';
import cartModel from "../models/cartModel.js";
import categoryModel from "../models/categoryModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";


export const addToCart = async (req, res) => {
  const { id } = req.params;
  const data = {
    userId: id,
    productId: req.body.productId,
    qty: req.body.qty
  };
  const newCartItem = new cartModel(data);
  const savedCartItem = await newCartItem.save();

  return res.status(200).json(savedCartItem);

}

export const getCartByUserId = async (req, res) => {
  const { id } = req.params;
  const cart = await cartModel.find({ userId: id });

  const user = await userModel.findById(id);

  let dex = [];

  for (let i = 0; i < cart.length; i++) {
    const product = await productModel.findById(cart[i].productId);

    const cat = await categoryModel.findById(product.category);

    const productPrice =
      product.price ??
      product.priceFC ??
      product.priceSC ??
      product.priceMC ??
      product.priceBC ??
      0;

    let dat = {
      cartId: cart[i]._id,
      productId: product._id,
      name: product.name,
      image: product.productThumbnail,
      category: cat?.name || "",
      price: productPrice,
      qty: cart[i].qty,
      totalPrice: productPrice * cart[i].qty
    }


    dex.push(dat);
  }


  return res.status(200).json(dex);
}

export const deleteCart = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  const cart = await cartModel.findOneAndDelete({ _id: id });

  if (cart) {
    res.status(200).json(cart);
  } else {
    return res.status(400).json({ error: "No Such cart Found.!." });
  }
};

export const buyNow = async (req, res) => {
  const { id } = req.params;
  const cart = await cartModel.find({ userId: id });

  for (let i = 0; i < cart.length; i++) {
    const cId = cart[i]._id;
    await cartModel.findByIdAndDelete({ _id: cId });
  }

  const data = {
    userId: id,
    productId: req.body.productId,
    qty: 1
  };
  const newCartItem = new cartModel(data);
  const savedCartItem = await newCartItem.save();

  return res.status(200).json(savedCartItem);


}