const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidNum,
    validQuantity } = require("../validators/validator")

    const createOrder = async (req, res) => {
        try {
          let userId = req.params.userId;
          let data = req.body;
          let findCart = await cartModel.findOne({ userId: userId });
          if(!findCart) return res.status(404).send({ status: false, message: `No cart found with this  userId` })
      
          if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" });
        }
          if(findCart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });
  
          if(!isValid(data.cartId)) return res.status(400).send({ status: false, message: "CartId is required" })
          if(!isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: "Enter a valid cartId" })
      
      
          if(findCart._id.toString() !== data.cartId) return res.status(400).send({ status: false, message: 'CartId not matched' });
      
         
          if(data.cancellable || typeof data.cancellable == 'string') {
            if(!data.cancellable) return res.status(400).send({ status: false, message: "Enter a value for is cancellable" })
     
            if(typeof data.cancellable == 'string'){
           
              data.cancellable = data.cancellable.toLowerCase().trim();;
              if(data.cancellable == 'true' || data.cancellable == 'false') {
              
                data.cancellable = JSON.parse(data.cancellable);  

               }
            }
            if(typeof data.cancellable !== 'boolean') return res.status(400).send({ status: false, message: "Cancellable should be in boolean value" })
          }
      
          
          if(data.status) {
            if(!isValid(data.status)) return res.status(400).send({ status: false, message: "Enter a valid value for is order status" });
      
            
            if(!(['Pending','Completed','Cancelled'].includes(data.status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });
          }
      
         
          data.totalQuantity = 0
          findCart.items.map(x => {
            data.totalQuantity += x.quantity
          })
      
          data.userId = userId;
          data.items = findCart.items;
          data.totalPrice = findCart.totalPrice;
          data.totalItems = findCart.totalItems;
      
          let orderdata = await orderModel.create(data);
          if(data.status){
          if([!'Pending']){
          await cartModel.updateOne(
                {_id: findCart._id},
                 {items: [], totalPrice: 0, totalItems: 0}
               )
          }
        }
          res.status(201).send({ status: true, message: "Order placed successfully", data: orderdata });
        } catch (err) {
          res.status(500).send({ status: false, error: err.message })
        }
      }

module.exports = {createOrder}