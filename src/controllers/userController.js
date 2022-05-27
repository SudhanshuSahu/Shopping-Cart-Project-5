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

        let { fname, lname, email, phone, password, address,profileImage } = requestBody

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
            return res.status(409).send({ status: false, msg: "Email already exist" })
        }

        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone is required" })
        }
        if (!isValidMobile(phone)) {
            return res.status(400).send({ status: false, message: "Phone no. is not valid" })
        }
        let uniquePhone = await userModel.findOne({ phone: phone })
        if (uniquePhone) {
            return res.status(409).send({ status: false, msg: "Phone number already exist" })
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
        if (!isValid(requestBody.address.shipping)) return res.status(400).send({ status: false, message: "shipping address should be required" })

        if (!isValid(requestBody.address.shipping.street)) return res.status(400).send({ status: false, message: "Street is required of shipping address" })

        if (!isValid(requestBody.address.shipping.city)) return res.status(400).send({ status: false, message: "City is required of shipping address" })

        if (!isValid(requestBody.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of shippingg address" })
        if (!isValidPinCode(requestBody.address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" })

        if (!isValid(requestBody.address.billing)) return res.status(400).send({ status: false, message: "Billing address should be required" })

        if (!isValid(requestBody.address.billing.street)) return res.status(400).send({ status: false, message: "Street is required of billing address" })

        if (!isValid(requestBody.address.billing.city)) return res.status(400).send({ status: false, message: "City is required of billing address" })

        if (!isValid(requestBody.address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of billing address" })
        if (!isValidPinCode(requestBody.address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" })


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
const updateUser = async (req, res) => {
    try {
      let userId = req.params.userId;

      if(!isValidObjectId(userId))return res.status(400).send({  status: false, message: "Please Provide valid userId"})
      let data = req.body;
     
  
      let userProfile = await userModel.findById(userId);
      if(!userProfile){return res.status(404).send({status:false, message:"user not found!"})}

  
      
    //   let finduser= await  userModel.findById(userId)
     // console.log(finduser)
  
     // let requestBody = req.body
  
          let { fname, lname, email, phone, password, address,profileImage } = data
          if(fname){
              if(!isValid(fname))return res.status(400).send({ status: false, message: "fname is required" })
              if(!isValidName(fname)) return res.status(400).send({ status: false, message: "First name should be alphabetical " })
          }
          if(lname){
              if (!isValid(lname))return res.status(400).send({ status: false, message: "lname is required" }) 
              if (!isValidName(lname))  return res.status(400).send({ status: false, message: "Last name should be alphabetical " })
                 
          }
          if(email){
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
          if(phone){
              if (!isValid(phone)) {
                  return res.status(400).send({ status: false, message: "Phone is required" })
              }
           
          if (!isValidMobile(phone)) {
              return res.status(400).send({ status: false, message: "Phone no. is not valid" })
          }
          let uniquePhone = await userModel.findOne({ phone: phone })
          if (uniquePhone) {
              return res.status(409).send({ status: false, msg: "Phone number already exist" })
          }
      }
      if(password){
          if (!isValid(password)) return res.status(400).send({ status: false, msg: "Password is a mendatory field" })
  
          if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })
  
         
          const encryptPassword = await bcrypt.hash(password, 10)
          requestBody.password = encryptPassword
      }
     
    
      if(address) {
        
        if (!isValid(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });
  
        //JSON.parse(JSON.stringify(userProfile.address))
        address = JSON.parse(address)
        
        let tempAddress = userProfile.address
  
        if(address.shipping) {
          
          if (!isValid(address.shipping)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });
  
          if(address.shipping.street){
            if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Street of shipping address should be valid and not an empty string" });
  
            tempAddress.shipping.street =address.shipping.street 
          }
  
          
          if (address.shipping.city) {
            if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "City of shipping address should be valid and not an empty string" });
  
            tempAddress.shipping.city = address.shipping.city
          }
  
          
          if (address.shipping.pincode) {
            if (!isValid(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode of shipping address and should not be an empty string" });
  
            if (!isValidPinCode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });
  
           
  
            tempAddress.shipping.pincode =address.shipping.pincode;
          }
        }
  
        if(address.billing) {
        
          if (!isValid(address.billing)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });
  
          if(address.billing.street){
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
      if(profileImage){
        let files = req.files
        if(files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0]);
            requestBody.profileImage = uploadedFileURL
        }else{
            return res.status(400).send({ status : false, message: "No file Found" })

        }

    }

  
      let updateUser = await userModel.findOneAndUpdate(
        {_id: userId},
        data,
        {new: true}
      )
      res.status(201).send({ status: true, message: "User profile updated", data: updateUser });
     
    } catch (err) {
      res.status(500).send({ status: false, error: err.message })
    }
  }
     
     
     
    


module.exports = { createUser, loginUser, getUserProfile,updateUser }
