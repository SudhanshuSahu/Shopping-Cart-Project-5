const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const mongoose  = require('mongoose');
const app = express();
const multer = require("multer")
app.use(bodyParser.json());



mongoose.connect("mongodb+srv://sudhanshu48:123abc@functionup.veeix.mongodb.net/group47Database", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use(multer().any())
app.use('/', route)


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});