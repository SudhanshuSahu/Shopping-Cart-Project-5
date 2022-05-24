const bcrypt = require("bcrypt")
const aws = require("aws-sdk")
const userModel = require("../models/userModel")
const {isValid,
    isValidEmail,
    isValidRequestBody,
    isValidName,
    isValidMobile,
    isValidObjectId,
    isValidPassword} = require("../validators/validator")
 

// aws.config.update({
//     accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
//     secretAccessKey: "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",
//     region: "ap-south-1"
// })

// let uploadFile= async ( file) =>{
//    return new Promise( function(resolve, reject) {
//     // this function will upload file to aws and return the link
//     let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

//     var uploadParams= {
//         ACL: "public-read",
//         Bucket: "classroom-training-bucket",  //HERE
//         Key: "abc/" + file.originalname, //HERE 
//         Body: file.buffer
//     }


//     s3.upload( uploadParams, function (err, data ){
//         if(err) {
//             return reject({"error": err})
//         }
//         console.log(data)
//         console.log("file uploaded succesfully")
//         return resolve(data.Location)
//     })

//    })
// }

const createUser = async function(req ,res){
    //==validating request body==//
    let requestBody = req.body
    if (!isValidRequestBody(requestBody)) return res.status(400).send({ status: false, message: "Invalid request, please provide details" })

    let {fname , lname , email , profileImage , phone , password , address }= requestBody

    if(!isValid(fname)){
        return res.status(400).send({status:false , message:"fname is required"})
    }
    if(!isValidName(fname)){
        return res.status(400).send({status:false , message:"Name should be alphabetical "})
    }
    if(!isValid(lname)){
        return res.status(400).send({status:false , message:"lname is required"})
    }
    if(!isValidName(lname)){
        return res.status(400).send({status:false , message:"Name should be alphabetical "})
    }
    if(!isValid(email)){
        return res.status(400).send({status:false , message:"fname is required"})
    }
    if(!isValidEmail(email)){
        return res.status(400).send({status:false , message:"Email is not valid"})
    }

    let uniqueEmail = await userModel.findOne({email:email})
    if(uniqueEmail){
        return res.status(400).send({status:false , msg:"email already exist"})
    }
 
    if(!profileImage){
        return res.status(400).send({status:false , message:"profile Image is required"})
    }
    if(!isValid(phone)){
        return res.status(400).send({status:false , message:"phone is required"})
    }
    if(!isValidMobile(phone)){
        return res.status(400).send({status:false , message:"phone no. is not valid"})
    }
    let uniquePhone = await userModel.findOne({phone:phone})
    if(uniquePhone){
        return res.status(400).send({status:false , msg:"phone number already exist"})
    }
  
    //==validating password==//
    if (!isValid(password)) return res.status(400).send({ status: false, msg: "Password is a mendatory field" })
    if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: `Password ${password}  must include atleast one special character[@$!%?&], one uppercase, one lowercase, one number and should be mimimum 8 to 15 characters long` })

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash("B4c0/\/", salt, function(err, hash) {
            // Store hash in your password DB.
        });
    });
}
