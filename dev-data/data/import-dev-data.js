
//script for importing the dev data (tour-sample.json) into database
//run this script specifying the option as --import or --delete inside process.argv
const dotenv=require("dotenv")
dotenv.config({path:`${__dirname}/../../config.env`})

const fs=require('fs');
const mongoose=require("mongoose")
const Tour=require('../../model/tourModel')
const User=require('../../model/userModel')
const Review=require('../../model/reviewModel')

let con=process.env.DB_CONNECTION;
con=con.replace('<PASSWORD>',process.env.DB_PASSWORD);

try{
mongoose.connect(con,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(()=>{
    console.log('Successfully Connected')
})
}
catch(er)
{
    console.log(er);
}

const tours=JSON.parse(fs.readFileSync(`${__dirname}/tours.json`))
const users=JSON.parse(fs.readFileSync(`${__dirname}/users.json`))
const reviews=JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`))

//importing data
const importData=async()=>{
try{
     await Tour.create(tours)
     await User.create(users,{validateBeforeSave:false})
     await Review.create(reviews)
     console.log("successfully loaded")
     process.exit()
  }
  catch(er)
  {
    console.log(er)
  }
}

//deleting data
const deleteData=async()=>{
    try{
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log("successfully deleted")
        process.exit()
    }
    catch(er)
    {
        console.log(er)
    }
}

if(process.argv[2]=='--import')
{
    importData();
    
}
else if(process.argv[2]=='--delete')
{
    deleteData();
}

