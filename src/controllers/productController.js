const productModel = require("../models/productModel")
const { uploadFile } = require("../AWS/aws")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidNum } = require("../validators/validator")

//create product Function

const createProduct = async function (req, res) {
    let data = req.body

    //Validation for empty Body
    if (!isValidRequestBody(data)) {
        return res.status(400).send({ status: true, msg: "Data must be present" })
    }

    //Destructuring the object
    const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

    if (!isValid(title)) {
        return res.status(400).send({ status: true, msg: "Title is mandatory" })
    }

    if (!isValid(description)) {
        return res.status(400).send({ status: true, msg: "description is mandatory" })
    }
    if (!isValid(price)) {
        return res.status(400).send({ status: true, msg: "price is mandatory" })
    }
    if (!isValidNum(price)) {
        return res.status(400).send({ status: true, msg: "price Should be numeric" })
    }

    if (!isValid(currencyId)) {
        return res.status(400).send({ status: true, msg: "CurrencyId is mandatory" })
    }
    if (currencyId !== "INR") {
        res.status(400).send({ status: false, msg: "currency should be in INR" })
        return
    }

    // if (currencyFormat !== "₹") {
    //     res.status(400).send({ status: false, msg: "currencyFormat should be in ₹" })
    //     return
    // }

    // if(!isValid(currencyFormat)){
    //     return res.status(400).send({status:true,msg:"currencyFormat is mandatory"})
    // }

    if (!isValidNum(installments)) {
        return res.status(400).send({ status: true, msg: "Installments Should be in number" })
    }



    if (availableSizes) {
        var availableSize = availableSizes.toUpperCase().split(",")
        console.log(availableSize);  // Creating an array

        //  Enum validation on availableSizes
        for (let i = 0; i < availableSize.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
                return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
        }
    }



    // Checking duplicate entry of title
    let duplicateTitle = await productModel.find({ title: title })
    if (duplicateTitle.length != 0) {
        return res.status(400).send({ status: false, msg: "Title already exist" })
    }

    let files = req.files;
    if (files && files.length > 0) {
        let uploadedFileURL = await uploadFile(files[0]);
        let productImage = uploadedFileURL

        const product = {
            title, description, price, currencyId, currencyFormat: "₹", isFreeShipping, productImage, style, availableSizes: availableSize, installments
        }
        console.log(product);
        let productData = await productModel.create(product)
        return res.status(201).send({ status: true, msg: "Product created", data: productData })
    }

}

//Get function to fetch the products

const getproducts = async function (req, res) {
    let filter = req.query
    let Name = filter.name
    let size = filter.size
    let priceGreaterThan = filter.priceGreaterThan
    let priceLessThan = filter.priceLessThan
    const getproduct = { isDeleted: false };
    if (Name) {
        if (!isValid(Name)) {
            return res.status(400).send({ status: false, message: `User id ${Name} is not valid` })
        }
        getproduct["title"] = Name
    }
    if (priceGreaterThan) {
        if (!isValid(priceGreaterThan)) {
            return res.status(400).send({ status: false, message: `User id ${priceGreaterThan} is not valid` })
        }
        if (!isValidNum(priceGreaterThan)) {
            return res.status(400).send({ status: true, msg: "Price Should be in number" })
        }
        getproduct["price"] = { $gt: priceGreaterThan }
    }
    if (priceLessThan) {
        if (!isValid(priceLessThan)) {
            return res.status(400).send({ status: false, message: `User id ${priceLessThan} is not valid` })
        }
        if (!isValidNum(priceLessThan)) {
            return res.status(400).send({ status: true, msg: "Price Should be in number" })
        }
        getproduct["price"] = { $lt: priceLessThan }
    }
    if (size) {
        if (isValid(size)) {
            var available = size.toUpperCase().split(",")
            for (let i = 0; i < available.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(available[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }


            }
        } else { return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` }) }
        getproduct["availableSizes"] = { $all: available }
    }
    if (priceGreaterThan && priceLessThan) {
        if (!isValid(priceGreaterThan)) {
            return res.status(400).send({ status: false, message: `User id ${priceGreaterThan} is not valid` })
        }
        if (!isValidNum(priceGreaterThan)) {
            return res.status(400).send({ status: true, msg: "Price Should be in number" })
        }
        if (!isValid(priceLessThan)) {
            return res.status(400).send({ status: false, message: `User id ${priceLessThan} is not valid` })
        }
        if (!isValidNum(priceLessThan)) {
            return res.status(400).send({ status: true, msg: "Price Should be in number" })
        }
        getproduct["price"] = { $gt: priceGreaterThan, $lt: priceLessThan }
    }
    const findbyfilter = await productModel.find(getproduct).sort({ price: 1 })
    if (findbyfilter.length == 0) return res.status(404).send({ msg: "product not found" })
    return res.status(201).send({ msg: "All products", data: findbyfilter })

}

const getProductById = async function (req, res) {
    try {

        const productId = req.params.productId;
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide valid productId" })

        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productDetails) return res.status(404).send({ status: false, message: "No such product exists" })

        return res.status(200).send({ status: true, message: 'Success', data: productDetails })

    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}
const deleteProductbyId = async function (req, res) {
    try {
      let id = req.params.productId;
  
      if (!isValidObjectId(id)) {
        return res.status(400).send({ status: false, message: `productId is invalid.` });
      }
  
      let getProduct = await productModel.findOne({ _id: id });
      if (!getProduct) {
        return res.status(404).send({ status: false, message: "No such Product found" });
      }
  
      if(getProduct.isDeleted == true) {
        return res.status(404).send({ status: false, message: `${getProduct.title} is already been deleted.` })
      }
      
      let products=await productModel.findOneAndUpdate(  { _id: id }, { isDeleted: true, deletedAt: new Date().toLocaleString() }, { new: true });
       
        res.status(200).send({status: true,message: "Successfully deleted the product",data:products});
    } catch (err) {
      res.status(500).send({ status: false, Error: err.message });
    }
  };
module.exports = { createProduct, getproducts, getProductById ,deleteProductbyId}

