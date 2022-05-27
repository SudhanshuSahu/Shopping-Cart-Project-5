const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")
const { uploadFile } = require("../AWS/aws")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidNum } = require("../validators/validator")

const createCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Provide valid userId" })

        const userExist = await userModel.findOne({ _id: userId })
        console.log(userExist)

        if (!userExist) return res.status(404).send({ status: false, message: "No such User Exists" })

        let createData = req.body

        const checkCardId = await cartModel.findOne({ userId })
        if (checkCardId) {
            if (!createData.cartId)
                return res.status(400).send({ status: false, message: "your cart is already created please enter your carid" })
            if (!isValid(createData.cartId)) {
                return res.status(400).send({ status: false, message: "enter cardid" })
            }
            if (!isValidObjectId(createData.cartId)) {
                return res.status(400).send({ status: false, message: "Please Provide valid cartId" })
            }

        }


        const { items, productId, quantity } = createData
        if (!items) {
            return res.status(400).send({ status: false, message: "items required" })
        }
        if (!isValid(items)) {
            return res.status(400).send({ status: false, message: ` ${items} is not valid` })
        }
        if (items.length == 0) {
            return res.status(400).send({ status: false, message: "not empty" })
        }
        if (!items[0].productId) {
            return res.status(400).send({ status: false, message: "enter productid" })
        }
        if (!isValidObjectId(items[0].productId)) {
            return res.status(400).send({ status: false, message: "Please Provide valid productId" })
        }
        console.log(items[0].productId)
        const findProduct = await productModel.findOne({ _id: items[0].productId, isDeleted: false })
        console.log(findProduct)

        if (!findProduct) {
            return res.status(400).send({ status: true, message: `No product is available for ${productId}` })
        }

        if (!items[0].quantity) {
            return res.status(400).send({ status: false, message: "quantity required" })
        }
        if (!isValid(items[0].quantity)) {
            return res.status(400).send({ status: false, message: "not a valid quantity" })
        }
        if (!typeof items[0].quantity === Number && items[0].quantity <= 0) {
            return res.status(400).send({ status: false, message: "quantity should be in numbers" })
        }
        console.log(findProduct.price)
        if (!checkCardId) {

            var cartData = {
                userId: userId,
                items: [{
                    productId: items[0].productId,
                    quantity: items[0].quantity
                }],
                totalPrice: (findProduct.price) * (items[0].quantity),
                totalItems: 1
            }
        }
        console.log(cartData)
        const createNewCart = await cartModel.create(cartData)

        return res.status(201).send({ status: true, message: "Cart created successfully", data: createNewCart })

    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }

}

module.exports = { createCart }