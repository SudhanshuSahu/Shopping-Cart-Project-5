const express = require('express')
const { createProduct, getproducts, getProductById } = require('../controllers/productController')
const router = express.Router()
const {createUser, loginUser, getUserProfile,updateUser} = require("../controllers/userController")
const {authentication,authorisation } = require("../middleware/auth") 

router.post("/register",createUser)

router.post("/login", loginUser)

router.get("/user/:userId/profile",authentication, getUserProfile)
//router.post("/update/:userId",updateUser)
router.put("/user/:userId/profile",updateUser )
router.post("/products",createProduct)
router.get("/products",getproducts)
router.get("products/:productId",getProductById)




module.exports =router