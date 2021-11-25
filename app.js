
require('dotenv').config();  //No need to assign to constant.This package will automatically load env variables from env file into the process in which this package is actively running.
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require('mongoose');
const encrypt=require("mongoose-encryption");

const app=express();



app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]}); //Encrypts only the password field in user schema based on our secret string..So, email not encrypted

const User=new mongoose.model("User",userSchema);


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    
    res.render("register");
});

//When user enters data and click register 
app.post("/register",function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save(function(err){
        if(!err)
        res.render("secrets");
        else
        console.log(err);
    });
});

app.post("/login",function(req,res){
    const userName=req.body.username;
    const password=req.body.password;

    User.findOne({email:userName},function(err,foundUser){
        if(err)
        console.log(err);
        else //No error
        {
            if(foundUser) { //We found the user in the database with entered username.
                if(foundUser.password===password){  //If password entered is correct.
                    res.render("secrets");
                }
        
            }
        }

    });
});

app.listen(3000,function(){
    console.log("Server started");
});