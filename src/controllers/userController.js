const bcrypt = require("bcrypt")
const aws = require("aws-sdk")
const userModel = require("../models/userModel")
const { uploadFile } = require("../AWS/aws")
const jwt = require("jsonwebtoken")
const { isValid,
    isValidEmail,
    isValidRequestBody,
    isValidName,
    isValidMobile,
    isValidObjectId,
    isValidPassword,
    isValidPinCode } = require("../validators/validator")


const createUser = async function (req, res) {
    try {
        //==validating request body==//
        let requestBody = req.body
        // requestBody = JSON.parse(requestBody.address)
        if (!isValidRequestBody(requestBody)) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })

        let { fname, lname, email, phone, password, address } = requestBody

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!isValidName(fname)) {
            return res.status(400).send({ status: false, message: "First name should be alphabetical" })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!isValidName(lname)) {
            return res.status(400).send({ status: false, message: "Last name should be alphabetical " })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is not valid" })
        }

        let uniqueEmail = await userModel.findOne({ email: email })
        if (uniqueEmail) {
            return res.status(400).send({ status: false, msg: "Email already exist" })
        }

        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone is required" })
        }
        if (!isValidMobile(phone)) {
            return res.status(400).send({ status: false, message: "Phone no. is not valid" })
        }
        let uniquePhone = await userModel.findOne({ phone: phone })
        if (uniquePhone) {
            return res.status(400).send({ status: false, msg: "Phone number already exist" })
        }

        //==validating password==//
        if (!isValid(password)) return res.status(400).send({ status: false, msg: "Password is a mendatory field" })

        if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })

        if (!isValid(requestBody.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });


        requestBody.address = JSON.parse(requestBody.address)

        if (!isValid(requestBody.address.shipping)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });


        if (!requestBody.address.shipping.street) return res.status(400).send({ status: false, message: "Street is required of shipping address" });


        if (!requestBody.address.shipping.city) return res.status(400).send({ status: false, message: "City is required of shipping address" });


        if (!requestBody.address.shipping.pincode) return res.status(400).send({ status: false, message: "Pincode is required of shipping address" });


        if (!isValid(requestBody.address.billing)) return res.status(400).send({ status: false, message: "Billing address should be required" })

        if (!isValid(requestBody.address.billing.street)) return res.status(400).send({ status: false, message: "Street is required of billing address" })

        if (!isValid(requestBody.address.billing.city)) return res.status(400).send({ status: false, message: "City is required of billing address" })

        if (!isValid(requestBody.address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of billing address" })



        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0]);
            //res.status(201).send({ status: true,msg: "file uploaded succesfully", data: uploadedFileURL });
            requestBody.profileImage = uploadedFileURL

            //password encryption
            const encryptPassword = await bcrypt.hash(password, 10)
            requestBody.password = encryptPassword

            let createUserData = await userModel.create(requestBody)
            return res.status(201).send({ status: true, message: "user created successfully", data: createUserData })
        }
        else {
            return res.status(400).send({ msg: "No file Found" })

        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

const loginUser = async function (req, res) {

    try {

        let credential = req.body
        const { email, password } = credential

        if (!isValidRequestBody(credential)) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is not valid" })
        }

        //==validating password==//
        if (!isValid(password)) return res.status(400).send({ status: false, msg: "Password is a mendatory field" })

        if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })

        const checkData = await userModel.findOne({ email })

        if (!checkData) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        const validPassword = await bcrypt.compare(password, checkData.password)

        if (!validPassword) {
            return res.status(400).send({ status: false, message: "Password is Invalid " })
        }

        let loginCredentials = checkData._id

        // JWT generation using sign function
        let token = jwt.sign(
            {
                email: checkData.email.toString(),
                userId: loginCredentials,
            },
            "Group47",
            {
                expiresIn: "24h",
            }
        );

        // JWT generated sent back in response header
        //res.setHeader("x-api-key", token);

        res.status(200).send({
            status: true,
            message: "Login Successfull",
            data: { userId: loginCredentials, token: token }
        });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const getUserProfile = async function (req, res) {
    try {
        const userId = req.params.userId;

        //checking valid userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Provide valid userId" })

        const userDetails = await userModel.findById({ _id: userId })

        if (!userDetails) return res.status(404).send({ status: false, message: "No such User Exists" })

        return res.status(200).send({ status: true, message: "User profile details", data: userDetails })
    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}


const updateUser = async function (req, res) {
    try {

        let userId = req.params.userId
        let files = req.files
        let requestBody = req.body
        let { fname, lname, email, phone, password, address } = requestBody;

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Provide valid userId" })

        //if user in updating his fname
        if (fname) {
            if (!isValid(fname)) return res.status(400).send({ status: false, message: "fname is required" })
            if (!isValidName(fname)) return res.status(400).send({ status: false, message: "First name should be alphabetical " })
        }

        //if user in updating his lname
        if (lname) {
            if (!isValid(lname)) return res.status(400).send({ status: false, message: "lname is required" })
            if (!isValidName(lname)) return res.status(400).send({ status: false, message: "Last name should be alphabetical " })

        }

        //if user in updating his email
        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Email is required" })
            }
            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Email is not valid" })
            }
            let uniqueEmail = await userModel.findOne({ email: email })
            if (uniqueEmail) {
                return res.status(409).send({ status: false, msg: "Email already exist" })
            }
        }

        //if user in updating his phone number
        if (phone) {
            if (!isValid(phone)) {
                return res.status(400).send({ status: false, message: "Phone is required" })
            }

            if (!isValidMobile(phone)) {
                return res.status(400).send({ status: false, message: "Phone no. is not valid" })
            }
            let uniquePhone = await userModel.findOne({ phone: phone })
            if (uniquePhone) {
                return res.status(400).send({ status: false, msg: "Phone number already exist" })
            }
        }

        //if user in updating his password
        if (password) {
            if (!isValid(password)) return res.status(400).send({ status: false, msg: "Password is a mendatory field" })

            if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })

            //encryting password 
            const encryptPassword = await bcrypt.hash(password, 10)
            requestBody.password = encryptPassword
        }

        //Shipping address validation
        if (address) {
            let shippingAddressToString = JSON.stringify(address)
            //console.log(shippingAddressToString)
            let parsedShippingAddress = JSON.parse(shippingAddressToString)
            //console.log(parsedShippingAddress)

            if (isValidRequestBody(parsedShippingAddress)) {
                if (parsedShippingAddress.hasOwnProperty('shipping')) {
                    if (parsedShippingAddress.shipping.hasOwnProperty('street')) {
                        if (!isValid(parsedShippingAddress.shipping.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's Street" });
                        }
                    }
                    if (parsedShippingAddress.shipping.hasOwnProperty('city')) {
                        if (!isValid(parsedShippingAddress.shipping.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's City" });
                        }
                    }
                    if (parsedShippingAddress.shipping.hasOwnProperty('pincode')) {
                        if (!isValid(parsedShippingAddress.shipping.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's pincode" });
                        }
                        if (!isValidPinCode(parsedBillingAddress.shipping.pincode)) {
                            return res.status(400).send({ status: false, message: "Please enter a valid pincode of 6 digits" })
                        }
                    }
                    var shippingStreet = address.shipping.street
                    var shippingCity = address.shipping.city
                    var shippingPincode = address.shipping.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address cannot be empty" });
            }
        }

        //Billing address validation
        if (address) {

            let billingAddressToString = JSON.stringify(address)
            let parsedBillingAddress = JSON.parse(billingAddressToString)

            if (isValidRequestBody(parsedBillingAddress)) {
                if (parsedBillingAddress.hasOwnProperty('billing')) {
                    if (parsedBillingAddress.billing.hasOwnProperty('street')) {
                        if (!isValid(parsedBillingAddress.billing.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's Street" });
                        }
                    }
                    if (parsedBillingAddress.billing.hasOwnProperty('city')) {
                        if (!isValid(parsedBillingAddress.billing.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's City" });
                        }
                    }
                    if (parsedBillingAddress.billing.hasOwnProperty('pincode')) {
                        if (!isValid(parsedBillingAddress.billing.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's pincode" });
                        }
                        if (!isValidPinCode(parsedBillingAddress.billing.pincode)) {
                            return res.status(400).send({ status: false, message: "Please enter a valid pincode of 6 digits" })
                        }
                    }
                    var billingStreet = address.billing.street
                    var billingCity = address.billing.city
                    var billingPincode = address.billing.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Billing address cannot be empty" });
            }
        }

        //if file data is coming from user
        if (files) {
            if (isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
                }
                var updatedProfileImage = await uploadFile(files[0])
            }
        }

        //Updating document
        let changeProfileDetails = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {

                fname: fname,
                lname: lname,
                email: email,
                profileImage: updatedProfileImage,
                phone: phone,
                password: password,
                'address.shipping.street': shippingStreet,
                'address.shipping.city': shippingCity,
                'address.shipping.pincode': shippingPincode,
                'address.billing.street': billingStreet,
                'address.billing.city': billingCity,
                'address.billing.pincode': billingPincode

            }
        },

            { new: true })
        // console.log(changeProfileDetails)
        return res.status(200).send({ status: true, data: changeProfileDetails })

    } catch (error) {
        return res.status(500).send({ status: false, Error: error.message })
    }
}


module.exports = { createUser, loginUser, getUserProfile, updateUser }
