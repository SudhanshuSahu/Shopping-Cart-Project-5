const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidNum,
    validQuantity } = require("../validators/validator");


//---------------Create Cart--------------//

const createCart = async function (req, res) {

    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        let { quantity, productId, cartId } = requestBody;

 //-----------Request Body Validation---------//

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" });
        }


        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid User Id" });
        }



        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
        }

        if (!quantity) {
            quantity = 1;

        } else {
            if (!isValid(quantity) || !validQuantity(quantity)) {
                return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
            }
        }
//---------Find User by Id--------------//

        const findUser = await userModel.findById({ _id: userId });

        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!findProduct) {
            return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
        }
//----------Find Cart By Id----------//

        if (cartId) {
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Please provide valid cartId" });
            }

            var cartIsUnique = await cartModel.findOne({ _id: cartId, isDeleted: false })

            if (!cartIsUnique) {
                return res.status(400).send({ status: false, message: "cartId doesn't exits" })
            }
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId, isDeleted: false });

//------------Create New Cart------------//

        if (!findCartOfUser) {

            var cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity,
                    },
                ],
                totalPrice: findProduct.price * quantity,
                totalItems: 1,
            };

            const createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }
//--------Check Poduct Id Present In Cart-----------//

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + quantity * findProduct.price;

            let arr = findCartOfUser.items;

            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity += quantity;
                    let updatedCart = {
                        items: arr,
                        totalPrice: price,
                        totalItems: arr.length,
                    };
//-------------Update Cart---------------------//

                    let responseData = await cartModel.findOneAndUpdate(
                        { _id: findCartOfUser._id },
                        updatedCart,
                        { new: true }
                    );
                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });



                }
            }
 //---------Add Item & Update Cart----------//

            arr.push({ productId: productId, quantity: quantity });

            let updatedCart = {
                items: arr,
                totalPrice: price,
                totalItems: arr.length,
            };

            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
            return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
        }

    } catch (error) {
        res.status(500).send({ status: false, data: error.message });
    }
};

//--------------Update Cart---------------------//

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {

         return res.status(400).send({ status: false, message: "userid not match" })
        }
        const findUser = await userModel.findOne({ _id: userId, isDeleted: false })

        if (!findUser)

         return res.status(404).send({ status: false, message: "user not available" })

        let data = req.body

//------------Request Body Validation--------------//

        const { cartId, productId, removeProduct } = data
        if (!cartId) {
            return res.status(400).send({ status: false, message: "please input your cartid" })
        }
        if (!productId) {
            return res.status(400).send({ status: false, message: "please input your productid" })

        }

        if (!isValidObjectId(cartId)) {

            return res.status(400).send({ status: false, message: "cartid not match" })

        }
        const findCart = await cartModel.findOne({ _id: cartId, userid: userId, isDeleted: false })
        if (!findCart) {
            return res.status(404).send({ status: false, message: "cart not available" })
        }
        if (!(removeProduct === 0 || removeProduct === 1)) {
            return res.status(400).send({ status: false, message: `removeProduct should be 0 or 1 ` })
        }
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })

//------------Check Item Present In Cart-----------//

        let arr = findCart.items
        if (arr.length == 0) return res.status(404).send({ status: false, message: "product in cart not found", data: findCart })
        for (i = 0; i <= arr.length; i++) {


            if (arr[i].productId == productId) {
                let productPriceTotal = arr[i].quantity * findProduct.price
                productPriceTotal = productPriceTotal.toFixed(2)
                if (removeProduct === 0) {
                    const updateProductItem = await cartModel.findOneAndUpdate({ _id: cartId },
                        {
                            $pull: { items: { productId: productId } },
                            totalPrice: (findCart.totalPrice - productPriceTotal).toFixed(2),
                            totalItems: findCart.totalItems - 1
                        },
                        { new: true })
                    return res.status(200).send({ status: true, message: 'sucessfully removed product', data: updateProductItem })
                }
                if (removeProduct == 1) {
                    if (arr[i].quantity == 1 && removeProduct == 1) {
                        let emptyCart = await cartModel.findOneAndUpdate({ _id: cartId },
                            {
                                $pull: { items: { productId: productId } },
                                totalPrice: (findCart.totalPrice - productPriceTotal).toFixed(2),
                                totalItems: findCart.totalItems - 1
                            },
                            { new: true })
                        return res.status(200).send({ status: true, message: 'Product removed successfully', data: emptyCart })
                    }
                    arr[i].quantity = arr[i].quantity - 1
                    let updateCart = await cartModel.findByIdAndUpdate({ _id: cartId },
                        { items: arr, totalPrice: (findCart.totalPrice - findProduct.price).toFixed(2) },
                        { new: true });
                    return res.status(200).send({ status: true, msg: "Product is decreased successfully", data: updateCart })
                }
            } else return res.status(400).send({ status: false, message: "product not present in cart" })


        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })


    }


}

//function==> to Fetch cart details
const getCart = async function (req, res) {
    let userId = req.params.userId

    //check if userId is valid or not
    if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "User Id is not valid" })
    }

    //check if user is present with this userId
    let checkUserId = await userModel.findOne({ _id: userId })
    if (!checkUserId) {
        return res.status(404).send({ status: false, message: `User does not exist with this userId ${userId}` })
    }

    //check if cart is present or not
    let checkCart = await cartModel.findOne({ userId })
    if (!checkCart) {
        return res.status(404).send({ status: false, message: `Cart of user with user id :${userId} does not Exist` })
    }

    res.status(200).send({ status: true, data: checkCart })
}


//Function for delete cart
const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        let Cart = await cartModel.findOne({ userId: userId });
        if (!Cart) return res.status(404).send({ status: false, message: `No cart found with this  userId` });

        if (Cart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

        let deltcart = await cartModel.findByIdAndUpdate(
            { _id: Cart._id },
            { items: [], totalPrice: 0, totalItems: 0 },
            { new: true }
        )

        res.status(204).send({ status: true, message: "Products removed successfully" })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createCart, getCart, updateCart, deleteCart }
