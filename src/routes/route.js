const express = require('express')
const { createProduct, getproducts, getProductById,updateProduct, deleteProductbyId } = require('../controllers/productController')
const router = express.Router()
const {createUser, loginUser, getUserProfile,updateUser} = require("../controllers/userController")
const {authentication,authorisation } = require("../middleware/auth") 
const { createCart, updateCart,getCart,deleteCart}= require("../controllers/cartController")
const {createOrder ,updateOrder}= require("../controllers/orderController")



// User APIs
router.post("/register",createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile",authentication, getUserProfile)
router.put("/user/:userId/profile",authentication, authorisation, updateUser )

//Product APIs
router.post("/products",createProduct)
router.get("/products",getproducts)
router.get("/products/:productId",getProductById)
router.delete("/products/:productId",deleteProductbyId)
router.put("/products/:productId", updateProduct )

//Cart APIs
router.post("/users/:userId/cart",authentication, authorisation, createCart)
router.put("/users/:userId/cart", authentication, authorisation, updateCart)
router.get("/users/:userId/cart",authentication, getCart)
router.delete("/users/:userId/cart",authentication, authorisation, deleteCart)

//Order APIs
router.post('/users/:userId/orders',authentication,authorisation, createOrder);
router.put('/users/:userId/orders',authentication,authorisation, updateOrder);

// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
    res
      .status(404)
      .send({ status: false, message: "The api you requested is not available" });
  });
  
module.exports =router