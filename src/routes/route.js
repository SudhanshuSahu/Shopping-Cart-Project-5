const express = require('express')
const { createProduct, getproducts, getProductById,updateProduct, deleteProductbyId } = require('../controllers/productController')
const router = express.Router()
const {createUser, loginUser, getUserProfile,updateUser} = require("../controllers/userController")
const {authentication,authorisation } = require("../middleware/auth") 
const { createCart, updateCart,getCart,deleteCart}= require("../controllers/cartController")



// User APIs
router.post("/register",createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile",authentication, getUserProfile)
router.put("/user/:userId/profile",updateUser )

//Product APIs
router.post("/products",createProduct)
router.get("/products",getproducts)
router.get("/products/:productId",getProductById)
router.delete("/products/:productId",deleteProductbyId)
router.put("/products/:productId", updateProduct )

//Cart APIs
router.post("/users/:userId/cart",createCart)
router.put("/users/:userId/cart",updateCart)
router.get("/users/:userId/cart",getCart)
router.delete("/users/:userId/cart",deleteCart)







module.exports =router