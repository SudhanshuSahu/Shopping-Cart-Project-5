const ObjectId = require("mongoose").Types.ObjectId


//==Request Body Validation
let isValidRequestBody = function (body) {
    if (Object.keys(body).length === 0) return false;
    return true;
}
//************************//

//==Mandatory Field Validation
let isValid = function (value) {
    if (typeof value === 'undefined' ||  value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    return true;
}
//************************//

//==ObjectId Validation
let isValidObjectId = function (objectId) {
    if (!ObjectId.isValid(objectId)) return false;
    return true;
}
//************************//

//==Email Validation
let isValidEmail = function (email) {
    let emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    return emailRegex.test(email)
}
//************************//

//==Mobile Number Validation
let isValidMobile = function (number) {
    let mobileRegex = /^[6-9]{1}[0-9]{9}$/;
    return mobileRegex.test(number);
}
//************************//

//==Name Validation
let isValidName=function(name){
let nameRegex=/^[A-Za-z\s]{1,}[A-Za-z\s]{0,}$/;
return nameRegex.test(name);
}
//************************//

//==Password Validation
let isValidPassword=function(password){
    let regexPassword=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/
    return regexPassword.test(password);
}

//************************** */

let isValidPinCode = function(pincode){
    let regexPin =/^[1-9]{1}[0-9]{5}$/
    return regexPin.test(pincode)
}
//************************//

//Enum Validation
let isValidEnum= function(value){
    let size=["S", "XS", "M", "X", "L", "XXL", "XL"];
  return  size.includes(value) !== -1;
}

//Numeric Validation
const isValidNum = function(value) {
    if(!/^\d{1,5}\.?\d{0,2}$/.test(value.trim())){
        return false
    }
    return true
}

const validQuantity = function isInteger(value) {
    if(value < 1) return false
     if(value % 1 == 0 ) return true
}

const isValidScripts= function(title){
    const scriptRegex = /^[a-zA-Z , ]{2,30}$/
    return scriptRegex.test(title)
}

module.exports={isValid,
    isValidEmail,
    isValidMobile,
    isValidName,
    isValidObjectId,
    isValidPassword,
    isValidRequestBody,
    isValidPinCode,
    isValidEnum,
    isValidNum,
    validQuantity,
    isValidScripts
    }
