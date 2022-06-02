const productModel = require("../models/productModel")
const { uploadFile } = require("../AWS/aws")
const { isValid,
    isValidRequestBody,
    isValidObjectId,
    isValidNum,
    isValidScripts,
    validString
} = require("../validators/validator")
const currencySymbol = require("currency-symbol-map")
const { TimestreamWrite } = require("aws-sdk")

//create product Function

const createProduct = async function (req, res) {
    try {
        let data = req.body

        //Validation for empty Body
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: true, msg: "Data must be present" })
        }

        //Destructuring the object
        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = data

        if (!isValid(title) || !isValidScripts(title)) {
            return res.status(400).send({ status: true, msg: "Title is mandatory and should be valid" })
        }

        if (!validString(description) || !isValidScripts(description)) {
            return res.status(400).send({ status: true, message: "description is mandatory and should be valid" })
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
            var productImage = uploadedFileURL

        }
        if (files == 0) {
            return res.status(400).send({ status: false, message: "No file Found" })
        }

        const product = {
            title, description, price, currencyId, currencyFormat: currencySymbol(currencyId), isFreeShipping, productImage, style, availableSizes: availableSize, installments
        }
        console.log(product);
        let productData = await productModel.create(product)
        return res.status(201).send({ status: true, message: "Product created", data: productData })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }

}

//Get function to fetch the products

const getproducts = async function (req, res) {
    try {
        let filter = req.query
        let Name = filter.name
        let size = filter.size
        let priceGreaterThan = filter.priceGreaterThan
        let priceLessThan = filter.priceLessThan
        let priceSort = filter.priceSort
        const getproduct = { isDeleted: false };

        if (!validString(Name)) {
            return res.status(400).send({ status: false, message: 'Please enter name' })
        }

        if (Name) {
            if (!isValid(Name)) {
                return res.status(400).send({ status: false, message: `User id ${Name} is not valid` })
            }
            getproduct["title"] = Name
        }

        if (!validString(priceGreaterThan)) {
            return res.status(400).send({ status: false, message: 'Please enter pricegreaterThan' })
        }

        if (priceGreaterThan) {
            if (!isValid(priceGreaterThan)) {
                return res.status(400).send({ status: false, message: `User id ${priceGreaterThan} is not valid` })
            }
            if (!isValidNum(priceGreaterThan)) {
                return res.status(400).send({ status: true, message: "Price Should be in number" })
            }
            getproduct["price"] = { $gt: priceGreaterThan }
        }

        if (!validString(priceLessThan)) {
            return res.status(400).send({ status: false, message: 'Please enter priceLessThan' })
        }

        if (priceLessThan) {
            if (!isValid(priceLessThan)) {
                return res.status(400).send({ status: false, message: `User id ${priceLessThan} is not valid` })
            }
            if (!isValidNum(priceLessThan)) {
                return res.status(400).send({ status: true, message: "Price Should be in number" })
            }
            getproduct["price"] = { $lt: priceLessThan }
        }

        if (!validString(size)) {
            return res.status(400).send({ status: false, message: 'Please enter size' })
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
                return res.status(400).send({ status: true, message: "Price Should be in number" })
            }
            if (!isValid(priceLessThan)) {
                return res.status(400).send({ status: false, message: `User id ${priceLessThan} is not valid` })
            }
            if (!isValidNum(priceLessThan)) {
                return res.status(400).send({ status: true, message: "Price Should be in number" })
            }
            getproduct["price"] = { $gt: priceGreaterThan, $lt: priceLessThan }
        }

        if (!validString(priceSort)) {
            return res.status(400).send({ status: false, message: 'priceSort is Required' })
        }

        if (priceSort) {
            if (!isValid(priceSort) && !isValidScripts(priceSort)) return res.status(400).send({ status: false, message: "priceSort is required" })
            if (!isValidNum(priceSort)) return res.status(400).send({ status: false, message: "priceSort should be number " })
            priceSort = priceSort.toString().trim()
            if (!(priceSort == '-1' || priceSort == '1')) {
                return res.status(400).send({ status: false, message: `value of priceSort must be 1 or -1 ` })
            } else {
                priceSort = 1
            }

        }


        const findbyfilter = await productModel.find(getproduct).sort({ price: priceSort }).select({ _v: 0 })

        if (findbyfilter.length == 0) return res.status(404).send({ msg: "product not found" })
        return res.status(200).send({ msg: "All products", data: findbyfilter })
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }

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

const updateProduct = async function (req, res) {
    try {

        let productId = req.params.productId
        let updateData = req.body
        let files = req.files

        if (files && files.length > 0) {
            let profileImgUrl = await uploadFile(files[0]);
            updateData.productImage = profileImgUrl;
        }
        // if (files == 0) {
        //     return res.status(400).send({ status: false, message: "No file Found" })
        // }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }

        //Validation for empty Body
        if (!isValidRequestBody(updateData)) {
            return res.status(400).send({ status: true, msg: "Details must be present" })
        }
        //Destructuring the object
        const { title, description, price, currencyId, isFreeShipping, availableSizes, style, installments, isDeleted } = updateData

        if (!validString(title) || !isValidScripts(title)) {
            return res.status(400).send({ status: false, message: 'title is Required and should be valid' })
        }

        if (!validString(description) || !isValidScripts(description)) {
            return res.status(400).send({ status: true, msg: "description is mandatory" })
        }

        if (!validString(price)) {
            return res.status(400).send({ status: false, message: 'price is Required' })
        }

        if (price) {
            if (!isValid(price) && !isValidScripts(price)) return res.status(400).send({ status: false, message: "price is required" })
            if (!isValidNum(price)) return res.status(400).send({ status: false, message: "price should be number " })

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

        if (installments) {
            if (!isValidNum(installments)) {
                return res.status(400).send({ status: false, message: "Installments Should be in number" })
            }
        }

        if (availableSizes) {
            let availableSize = availableSizes.toUpperCase().split(",")
            console.log(availableSize);  // Creating an array

            //  Enum validation on availableSizes
            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
                updateData.availableSizes = availableSize;
            }
        }


        if (!validString(style) || !isValidScripts(style)) {
            return res.status(400).send({ status: true, message: "Please enter valid input" })
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

        if (getProduct.isDeleted == true) {
            return res.status(404).send({ status: false, message: `Product with the title : ${getProduct.title} is already been deleted.` })
        }

        let products = await productModel.findOneAndUpdate({ _id: id }, { isDeleted: true, deletedAt: new Date().toLocaleString() }, { new: true });

        res.status(200).send({ status: true, message: "Successfully deleted the product", data: products });
    } catch (err) {
        res.status(500).send({ status: false, Error: err.message });
    }
}

module.exports = { createProduct, getproducts, getProductById, updateProduct, deleteProductbyId }
