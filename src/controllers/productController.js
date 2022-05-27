const productModel = require("../models/productModel")
const { uploadFile } = require("../AWS/aws")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidEnum,
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


    if (!isValidEnum(availableSizes)) {
        return res.status(400).send({ status: false, message: `please provide available size from  ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
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
            title, description, price, currencyId, currencyFormat: "₹", isFreeShipping, productImage, style, availableSizes, installments
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
    if (Name) {
        if (!isValid(Name)) return res.status(400).send({ msg: "please give valid input" })
        const product = await productModel.find({ title: Name, isDeleted: false })
        if (product.length == 0) return res.status(404).send({ msg: "product not found" })
        return res.status(201).send({ msg: "All products", data: product })

    }
    if (size) {
        if (!isValid(size)) return res.status(400).send({ msg: "please give valid input" })
        const product = await productModel.find({ availableSizes: size, isDeleted: false })
        if (product.length == 0) return res.status(404).send({ msg: "product not found" })
        return res.status(201).send({ msg: "All products", data: product })

    } if (priceLessThan) {
        if (!isValid(priceLessThan)) return res.status(400).send({ msg: "please give valid input" })
        const product = await productModel.find({ price: { $lt: priceLessThan }, isDeleted: false }).sort({ price: -1 })
        if (product.length == 0) return res.status(404).send({ msg: "product not found" })
        return res.status(201).send({ msg: "All products", data: product })

    } if (priceGreaterThan) {
        if (!isValid(priceGreaterThan)) return res.status(400).send({ msg: "please give valid input" })
        const product = await productModel.find({ price: { $gt: priceGreaterThan }, isDeleted: false }).sort({ price: 1 })
        if (product.length == 0) return res.status(404).send({ msg: "product not found" })
        return res.status(201).send({ msg: "All products", data: product })

    } if (priceGreaterThan && priceLessThan) {
        if (!isValid(priceGreaterThan)) return res.status(400).send({ msg: "please give valid input" })
        if (!isValid(priceLessThan)) return res.status(400).send({ msg: "please give valid input" })

        const product = await productModel.find({ price: { $gt: priceGreaterThan, $lt: priceLessThan }, isDeleted: false }).sort({ price: 1 })

        if (product.length == 0) return res.status(404).send({ msg: "product not found" })
        return res.status(201).send({ msg: "All products", data: product })

    }



}
const getProductById = async function (req, res) {
    try {

        const productId = req.params.productId;
        if (!(isValidObjectId(productId))) return res.status(400).send({ status: false, message: "Please provide valid productId" })

        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productDetails) return res.status(404).send({ status: false, message: "No such product exists" })

        return res.status(200).send({ status: true, message: 'Success', data: productDetails })

    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}


const updateProduct = async function (req, res) {
    try {

        let productId = req.params.productId
        let updateData = req.body


        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }

        //Validation for empty Body
        if (!isValidRequestBody(updateData)) {
            return res.status(400).send({ status: true, msg: "Data must be present" })
        }
        //Destructuring the object
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSizes, style, installments, isDeleted } = updateData


        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: true, msg: "Title is mandatory" })
            }

            let uniqueTitle = await productModel.findOne({ title })

            if (uniqueTitle) {
                return res.status(400).send({ status: false, message: "This title already exist, try some new" })
            }
        }

        if (description) {
            if (!isValid(description)) {
                return res.status(400).send({ status: true, msg: "description is mandatory" })
            }
        }

        if (price) {
            if (!isValid(price)) {
                return res.status(400).send({ status: true, msg: "price is mandatory" })
            }

            if (!isValidNum(price)) {
                return res.status(400).send({ status: true, msg: "price Should be numeric" })
            }
        }


        if (currencyId) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: true, msg: "CurrencyId is mandatory" })
            }
            if (currencyId !== "INR") {
                res.status(400).send({ status: false, msg: "currency should be in INR" })
                return
            }

        }


        // if (currencyFormat !== "₹") {
        //     res.status(400).send({ status: false, msg: "currencyFormat should be in ₹" })
        //     return
        // }

        // if(!isValid(currencyFormat)){
        //     return res.status(400).send({status:true,msg:"currencyFormat is mandatory"})
        // }

        if (installments) {
            if (!isValidNum(installments)) {
                return res.status(400).send({ status: false, message: "Installments Should be in number" })
            }
        }


        if (availableSizes) {
            if (isValid(availableSizes)) {
                // if (!isValidEnum(availableSizes)) {
                //     return res.status(400).send({ status: false, message: `please provide available size from  ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                // }

                const newSizeArray = availableSizes.trim().split(",").map((s)=> s.trim());
                updateData.availableSizes = newSizeArray

            }
        }
        // if (subcategory) {
        //     const subCategoryArray = subcategory
        //       .trim()
        //       .split(",")
        //       .map((s) => s.trim());
        //     filter["subcategory"] = { $all: subCategoryArray };
        //   }

        if (productImage) {
            let files = req.files
            if (files && files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0]);
                updateData.productImage = uploadedFileURL
            } else {
                return res.status(400).send({ status: false, message: "No file Found" })

            }

        }


        let updatedProduct = await productModel.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            updateData,
            { new: true }
        )
        res.status(201).send({ status: true, message: "User profile updated", data: updatedProduct });


    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}
module.exports = { createProduct, getproducts, getProductById, updateProduct }