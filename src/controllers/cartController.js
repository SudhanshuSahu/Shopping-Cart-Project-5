const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidNum,
    validQuantity } = require("../validators/validator")

const createCart = async function (req, res) {

    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        const { quantity, productId } = requestBody;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid User Id" });
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
        }

        if (!isValid(quantity) || !validQuantity(quantity)) {
            return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
        }

        const findUser = await userModel.findById({ _id: userId });

        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!findProduct) {
            return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId });

        if (!findCartOfUser) {
            var cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity,
                    },
                ],
                totalPrice: findProduct.price *quantity,
                totalItems: 1,
            };
            const createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + req.body.quantity * findProduct.price;

            let arr = findCartOfUser.items;

            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity += quantity;
                    let updatedCart = {
                        items: arr,
                        totalPrice: price,
                        totalItems: arr.length,
                    };

                    let responseData = await cartModel.findOneAndUpdate(
                        { _id: findCartOfUser._id },
                        updatedCart,
                        { new: true }
                    );
                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });

                 
                    
                }
            }
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
const updateCart=async function(req,res){
    try{
        let userid=req.params.userId
        if(!isValidObjectId(userid)){
            return res.status(400).send({status:false,msg:"userid not match"})
        }
        const findUser=await userModel.findOne({_id:userid,isDeleted:false})
        if(!findUser)
        return res.status(404).send({status:false,msg:"user not available"})
        let data=req.body
        const {cartid,productid,removeProduct}=data
        if(!cartid){
            return res.status(400).send({status:false,msg:"plz input your cartid"})
        }
        if(!productid){
            return res.status(400).send({status:false,msg:"plz input your productid"})

        }
        if(!removeProduct){
            return res.status(400).send({status:false,msg:"plz input your removeproduct"})
            
        }
        if(!isValidObjectId(cartid)){

            return res.status(400).send({status:false,msg:"cartid not match"})

        }
        const findCart=await cartModel.findOne({_id:cartid,userid:userid,isDeleted:false})
        if(!findCart){
        return res.status(404).send({status:false,msg:"cart not available"})
        }
        if(removeProduct != 0 || removeProduct !=1) return res.status(400).send({status: false, message: "removeProduct value should be 0 or 1"})
        const findProduct=await productModel.findOne({_id:productid,isDeleted:false})
        let price=findCart. totalPrice-findProduct.price*removeProduct
        let arr=findCart.items
        for(i=0;i<=arr.length;i++){
            if(arr[i].productId==productid){
                arr[i].quantity-=removeProduct
                const updatedata= {items:arr,
                    totalPrice:price}
                    const cartUpdate= await cartModel.findOneAndUpdate({_id:cartid },updatedata,{new:true})
                    return res.status(200).send({status:true,msg:"cart updated successfully",data:cartUpdate})
            }
           
               
            }

    }catch(err){
        return res.status(500).send({status:false,msg:err.message})
        

    }
    
    
}



//function==> to Fetch cart details
const getCart = async function(req,res){
    let userId =req.params.userId

    //check if userId is valid or not
    if(!isValidObjectId(userId)){
        return res.status(400).send({status:false , message:"User Id is not valid"})
    }

    //check if user is present with this userId
    let checkUserId = await userModel.findOne({_id:userId})
    if(!checkUserId){
        return res.status(404).send({status:false , message:`User does not exist with this userId ${userId}`})
    }
 
    //check if cart is present or not
    let checkCart = await cartModel.findOne({userId})
    if(!checkCart){
        return res.status(404).send({status:false , message:`Cart of user with user id :${userId} does not Exist`})
    }
    
    res.status(200).send({status:true , data:checkCart})
}



module.exports = { createCart,getCart ,updateCart}
