const express = require('express')
const router = express.Router()
const {createUser, loginUser, getUserProfile, updateUser} = require("../controllers/userController")
const {authentication, authorisation} = require("../middleware/auth") 

router.post("/register",createUser)

router.post("/login", loginUser)

router.get("/user/:userId/profile",authentication, getUserProfile)

router.put("/user/:userId/profile",authentication, authorisation, updateUser )


module.exports =router