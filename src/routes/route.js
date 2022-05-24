const express = require('express')
const router = express.Router()
const {createUser, loginUser, getUserProfile} = require("../controllers/userController")
const {authentication} = require("../middleware/auth") 

router.post("/register",createUser)

router.post("/login", loginUser)

router.get("/user/:userId/profile",authentication, getUserProfile)




module.exports =router