//Using cookies and session so that no need to login again in our browser.When browser closed ,cookies will be deleted.

require('dotenv').config(); //No need to assign to constant.This package will automatically load env variables from env file into the process in which this package is actively running.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session=require('express-session'); //For creating session cookie
const passport=require('passport');  //For authenticating users.
//passport-local needed by passport-local-mongoose only.So, we don't require it in our code.
const passportLocalMongoose=require('passport-local-mongoose'); //So, that passport can communicate with database and authenticate user.

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

//We tell express app to use session package and set it up.
app.use(session({
    secret:"Our secret",  //Used to compute the hash
    resave:false,   //No need of resaving
    saveUninitialized:false  //Does not force a session that is ininitialised to be saved. Reduces server load and asks for permission before storing cookies.
}));

app.use(passport.initialize())  //Tells app to use passport and initialize it .//Sets up passport so that we can use it for authentication.
app.use(passport.session());  //Tell app to use the passport to manage session.

mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);  //When user enters password,passport will Hash and salts the password and then save in database

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //To setup passport local.(local login strategy - login by entering mail and a password in login page)

passport.serializeUser(User.serializeUser());  //Create a cookie and store info in it.
passport.deserializeUser(User.deserializeUser()); //Open a cookie and see the msg in it.

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {

    res.render("login");
    
});

app.get("/register", function (req, res) {

    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){   //If request is authenticated, i.e, request is made from the user who is already logged in.
        res.render("secrets");

    }
    else  //If user is not authenticated.
    res.redirect("/login");
});

//When user enters data and click register 
app.post("/register", function (req, res) {
    //Creating data of a user ,interacting with mongoose and saving it .All are done by register method in "passport-local-mongoose".
   User.register({username:req.body.username},req.body.password,function(err,user){
       if(err)
       {console.log(err);
        res.redirect("/register");
       }
        else{
       passport.authenticate("local")(req,res,function(){  //To authenticate the user.Type of authentication is local.
            res.redirect("/secrets");  //If registration successful then redirect to secret route
       });
        }
   });
});

app.post("/login", function (req, res) {
   
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,function(err){//Login function provided by passport module to enable users to login if password and email are correct.

        if(err)
        console.log(err);
        else
        {
        passport.authenticate("local")(req,res,function(){  //Authenticate the entered credentials.
            res.redirect("/secrets");  // If authenticated then user will be loggen in.
        });

        }
    });
});

//To deauthenticate user and end the session.
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.listen(3000, function () {
    console.log("Server started");
});