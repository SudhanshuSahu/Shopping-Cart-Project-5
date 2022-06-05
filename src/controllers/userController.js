const bcrypt = require("bcrypt")
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
    isValidPinCode,
    isValidScripts,
    validString
} = require("../validators/validator")


//function for create user api
const createUser = async function (req, res) {
    try {
        
        let requestBody = req.body
        
        //validation for request body
        if (!isValidRequestBody(requestBody)) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })
         
        //destructring request body
        let { fname, lname, email, phone, password} = requestBody
        
        //validation for fname
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!isValidName(fname)) {
            return res.status(400).send({ status: false, message: "First name should be alphabetical" })
        }

        //validation for lname
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!isValidName(lname)) {
            return res.status(400).send({ status: false, message: "Last name should be alphabetical " })
        }

        //validation for email
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is not valid" })
        }

        //checking for unique email address in db
        let uniqueEmail = await userModel.findOne({ email: email })
        if (uniqueEmail) {
            return res.status(409).send({ status: false, msg: "Email already exist" })
        }

        //validation for phone
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone is required" })
        }
        if (!isValidMobile(phone)) {
            return res.status(400).send({ status: false, message: "Phone no. is not valid" })
        }

        //checking for unique phone number in db
        let uniquePhone = await userModel.findOne({ phone: phone })

        //document is present
        if (uniquePhone) {
            return res.status(400).send({ status: false, message: "Phone number already exist" })
        }

        //validation for password
        if (!isValid(password))
            return res.status(400).send({ status: false, message: "Password is a mendatory field" })

        if (!isValidPassword(password))
            return res.status(400).send({ status: false, message: `Password  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })


        //validation for address     
        if (!isValid(requestBody.address))
            return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });

        //converting string into object
        requestBody.address = JSON.parse(requestBody.address)
        
        //validations for shipping address
        if (!isValid(requestBody.address.shipping))
            return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });


        if (!requestBody.address.shipping.street)
            return res.status(400).send({ status: false, message: "Street is required for shipping address" });


        if (!requestBody.address.shipping.city)
            return res.status(400).send({ status: false, message: "City is required for shipping address" });

        if (!isValidScripts(requestBody.address.shipping.city))
            return res.status(400).send({ status: false, message: "City should be in a valid format" })

        if (!requestBody.address.shipping.pincode)
            return res.status(400).send({ status: false, message: "Pincode is required for shipping address" });

        if (!isValid(requestBody.address.shipping))
            return res.status(400).send({ status: false, message: "shipping address should be required" })

        if (!isValid(requestBody.address.shipping.street))
            return res.status(400).send({ status: false, message: "Street is required for shipping address" })

        if (!isValid(requestBody.address.shipping.city))
            return res.status(400).send({ status: false, message: "City is required for shipping address" })

        if (!isValid(requestBody.address.shipping.pincode))
            return res.status(400).send({ status: false, message: "Pincode is required for shippingg address" })

        if (!isValidPinCode(requestBody.address.shipping.pincode))
            return res.status(400).send({ status: false, message: "Pincode should be valid 6 digit number" })
 
        //validations for billing address    
        if (!isValid(requestBody.address.billing))
            return res.status(400).send({ status: false, message: "Billing address should be required" })

        if (!isValid(requestBody.address.billing.street))
            return res.status(400).send({ status: false, message: "Street is required for billing address" })

        if (!isValid(requestBody.address.billing.city))
            return res.status(400).send({ status: false, message: "City is required for billing address" })

        if (!isValidScripts(requestBody.address.billing.city))
            return res.status(400).send({ status: false, message: "City should be in a valid format" })

        if (!isValid(requestBody.address.billing.pincode))
            return res.status(400).send({ status: false, message: "Pincode is required for billing address" })

        if (!isValidPinCode(requestBody.address.billing.pincode))
            return res.status(400).send({ status: false, message: "Pincode should be valid 6 digit number" })

        //files form form data
        let files = req.files

        //checking file is there or not , as files comes in array
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0]);

            requestBody.profileImage = uploadedFileURL

            //password encryption for security
            const encryptPassword = await bcrypt.hash(password, 10)
            requestBody.password = encryptPassword
            
            //creating user
            let createUserData = await userModel.create(requestBody)
            return res.status(201).send({ status: true, message: "user created successfully", data: createUserData })
        }
        else {

            return res.status(400).send({ message: "No file Found" })

        }
    } catch (err) {

        return res.status(500).send({ status: false, message: err.message })
    }

}

//function for login api
const loginUser = async function (req, res) {

    try {
         
        let credential = req.body

        //taking credentials from user
        const { email, password } = credential

        //validating request body
        if (!isValidRequestBody(credential)) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })

        //validations for email
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is not valid" })
        }

        //validating password
        if (!isValid(password)) return res.status(400).send({ status: false, message: "Password is a mendatory field" })

        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })

        //checking for email presence in db
        const checkData = await userModel.findOne({ email })
        
        //if email not found
        if (!checkData) {
            return res.status(404).send({ status: false, message: "User not found" })
        }

        //comparing bcrypt password with the password provided by the user
        const validPassword = await bcrypt.compare(password, checkData.password)

        //if password is not valid
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

//function for get api 
const getUserProfile = async function (req, res) {

    try {
        //taking user id from params
        const userId = req.params.userId;

        //checking valid userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Provide valid userId" })
 
        //checking for user in db
        const userDetails = await userModel.findById({ _id: userId })

        //if user not found
        if (!userDetails) return res.status(404).send({ status: false, message: "No such User Exists" })

        return res.status(200).send({ status: true, message: "User profile details", data: userDetails })

    } catch (error) {

        return res.status(500).send({ status: false, Error: error.message })
    }
}

//function for update api
const updateUser = async (req, res) => {

    try {
        
        let userId = req.userId
        let files = req.files
        let data = req.body;

        //destructring request body
        let { fname, lname, email, phone, password, address } = data

        //checking for user in db
       let userProfile = await userModel.findById(userId);
       
       //if no user found
       if(!userProfile){return res.status(404).send({status:false, message:"user not found!"})}

       //checking if file is coming
        if (files && files.length > 0) {

            //uploading file 
            let uploadedFileURL = await uploadFile(files[0]);
            data.profileImage = uploadedFileURL
        }


        //validating request body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "please provide details" })

        //validation for fname
        if (!validString(fname)) {
            return res.status(400).send({ status: false, message: 'fname is Required' })
        }

        if (fname) {
            
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide fname" })
            }
        }

        //validation for lname
        if (!validString(lname)) {
            return res.status(400).send({ status: false, message: 'lname is Required' })
        }

        if (lname) {
            if (!isValid(lname) && !isValidScripts(lname)) return res.status(400).send({ status: false, message: "lname is required" })
            if (!isValidName(lname)) return res.status(400).send({ status: false, message: "Last name should be alphabetical " })

        }

        //validation for email
        if (!validString(email)) {
            return res.status(400).send({ status: false, message: 'Email is Required' })
        }
        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Email is required" })
            }
            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Email is not valid" })
            }

            //checking for unique email address in db
            let uniqueEmail = await userModel.findOne({ email: email })

            //if email address is found in db
            if (uniqueEmail) {
                return res.status(409).send({ status: false, msg: "Email already exist" })
            }
        }

        //validation for phone number
        if (!validString(phone)) {
            return res.status(400).send({ status: false, message: 'Phone no is Required' })
        }

        if (phone) {
            if (!isValid(phone)) {
                return res.status(400).send({ status: false, message: "Phone is required" })
            }

            if (!isValidMobile(phone)) {
                return res.status(400).send({ status: false, message: "Phone no. is not valid" })
            }

            //checking for unque phone number in db
            let uniquePhone = await userModel.findOne({ phone: phone })

            //if found
            if (uniquePhone) {
                return res.status(409).send({ status: false, msg: "Phone number already exist" })
            }
        }

        //validation for password
        if (!validString(password)) {
            return res.status(400).send({ status: false, message: 'password is Required' })
        }
        if (password) {
            if (!isValid(password)) return res.status(400).send({ status: false, msg: "Password is a mendatory field" })

            if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })


            //bcrypting password using hash
            const encryptPassword = await bcrypt.hash(password, 10)
            requestBody.password = encryptPassword
        }

        //validations for address
        if (!validString(address)) {
            return res.status(400).send({ status: false, message: 'address is Required' })
        }
        if (address) {

            if (!isValid(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });

            address = JSON.parse(address)

            let tempAddress = userProfile.address

            if (address.shipping) {

                if (!isValid(address.shipping)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });

                if (address.shipping.street) {
                    if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Street of shipping address should be valid and not an empty string" });

                    tempAddress.shipping.street = address.shipping.street
                }


                if (address.shipping.city) {
                    if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "City of shipping address should be valid and not an empty string" });

                    tempAddress.shipping.city = address.shipping.city
                }


                if (address.shipping.pincode) {
                    if (!isValid(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode of shipping address and should not be an empty string" });

                    if (!isValidPinCode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });



                    tempAddress.shipping.pincode = address.shipping.pincode;
                }
            }

            if (address.billing) {

                if (!isValid(address.billing)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });

                if (address.billing.street) {
                    if (!isValid(address.billing.street)) return res.status(400).send({ status: false, message: "Street of billing address should be valid and not an empty string" });

                    tempAddress.billing.street = address.billing.street
                }


                if (address.billing.city) {
                    if (!isValid(address.billing.city)) return res.status(400).send({ status: false, message: "City of billing address should be valid and not an empty string" });

                    tempAddress.billing.city = address.billing.city
                }


                if (address.billing.pincode) {
                    if (!isValid(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode of billing address and should not be an empty string" });

                    if (!isValidPinCode(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });


                    tempAddress.billing.pincode = address.billing.pincode;
                }
            }

            data.address = tempAddress;
        }

        //updating doucument of user
        let updateUser = await userModel.findOneAndUpdate(
            { _id: userId },
            data,
            { new: true }
        )
        res.status(200).send({ status: true, message: "User profile updated", data: updateUser });

    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}



module.exports = { createUser, loginUser, getUserProfile, updateUser }
