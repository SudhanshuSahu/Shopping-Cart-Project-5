const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    
     } = require("../validators/validator")

    const createOrder = async (req, res) => {
      try {
        let userId = req.params.userId;
        let data = req.body;
         //checking if cart exists
        let findCart = await cartModel.findOne({ userId: userId });
        if(!findCart) return res.status(404).send({ status: false, message: `No cart found with this  userId` })
    
        if (!isValidRequestBody(data)) {
          return res.status(400).send({ status: false, message: "Please provide valid request body" });
      }
       //checking empty cart
       if(!isValid(data.cartId)) return res.status(400).send({ status: false, message: "CartId is required" })
       if(!isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: "Enter a valid cartId" })
        if(findCart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

    
        if(findCart._id.toString() !== data.cartId) return res.status(400).send({ status: false, message: 'CartId not matched' });
    
      //  checking cancellable value is present
        if(data.cancellable || typeof data.cancellable == 'string') {
          if(!data.cancellable) return res.status(400).send({ status: false, message: "Enter a value for is cancellable" })
   
          if(typeof data.cancellable == 'string'){
         //converting it to lowercase and removing white spaces
            data.cancellable = data.cancellable.toLowerCase().trim();;
            if(data.cancellable == 'true' || data.cancellable == 'false') {
            
              data.cancellable = JSON.parse(data.cancellable);  

             }
          }
          if(typeof data.cancellable !== 'boolean') return res.status(400).send({ status: false, message: "Cancellable should be in boolean value" })
        }
    
        
  //checking if status is present in request body
        if(data.status) {
          if(!isValid(data.status)) return res.status(400).send({ status: false, message: "Enter a valid value for is order status" });
    
           //validating if status is in valid format
          if(!(['Pending','Completed','Cancelled'].includes(data.status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });
        }
    
       //getting the totalQuantity of items in the cart
        data.totalQuantity = 0
        findCart.items.map(x => {
          data.totalQuantity += x.quantity
        })
    
        data.userId = userId;
        data.items = findCart.items;
        data.totalPrice = findCart.totalPrice;
        data.totalItems = findCart.totalItems;
    
        let orderdata = await orderModel.create(data);
      
        await cartModel.updateOne(
              {_id: findCart._id},
               {items: [], totalPrice: 0, totalItems: 0}
             )
        
      
        res.status(201).send({ status: true, message: "Order placed successfully", data: orderdata });
      } catch (err) {
        res.status(500).send({ status: false, error: err.message })
      }
    }



    const updateOrder = async (req, res) => {
      try {
        let data = req.body;
    
        //checking for a valid user input
        if (!isValidRequestBody(data)) {
          return res.status(400).send({ status: false, message: "Please provide valid request body" });
      }
    
        //checking for valid orderId
        if(!isValid(data.orderId)) return res.status(400).send({ status: false, message: 'OrderId is required and should not be an empty string' });
        if(!isValidObjectId(data.orderId)) return res.status(400).send({ status: false, message: 'Enter a valid orderId' });
    
        //checking if cart exists or not
        let findOrder = await orderModel.findOne({ _id: data.orderId, isDeleted: false });
        if(!findOrder) return res.status(404).send({ status: false, message: `No order found with this  orderid` })
    
        
        if(!isValid(data.status)) return res.status(400).send({ status: false, message: 'Status is required and should not be an empty string' });
    
        //validating if status is in valid format
        if(!(['Pending','Completed','Cancelled'].includes(data.status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });
    
        let conditions = {};
    
        if(data.status == "Cancelled") {
          //checking if the order is cancellable or not
          if(!findOrder.cancellable) return res.status(400).send({ status: false, message: "cancelletion is false:You cannot cancel this order" });
          conditions.status = data.status;
        }else{
          conditions.status = data.status;
        }
        
        let orderdata = await orderModel.findByIdAndUpdate(
          {_id: findOrder._id},
          conditions,
          {new: true}
        )
        res.status(200).send({ status: true, message: "Order updated Successfully", data: orderdata});
      } catch (err) {
        res.status(500).send({ status: false, error: err.message })
      }
    }

    module.exports = {createOrder,updateOrder}