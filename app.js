//Using cookies and session so that no need to login again in our browser.When browser closed ,cookies will be deleted.
//Using ggl for authentication
require('dotenv').config(); //No need to assign to constant.This package will automatically load env variables from env file into the process in which this package is actively running.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session=require('express-session'); //For creating session cookie
const passport=require('passport');  //For authenticating users.
//passport-local needed by passport-local-mongoose only.So, we don't require it in our code.
const passportLocalMongoose=require('passport-local-mongoose'); //So, that passport can communicate with database and authenticate user.
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");  //To use findOrCreate function

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
    password: String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);  //When user enters password,passport will Hash and salts the password and then save in database
userSchema.plugin(findOrCreate); //Add findOrCreate as a plugin to userSchena

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //To setup passport local.(local login strategy - login by entering mail and a password in login page)

//Global authentication(For any local or ggl or fb authentication)
passport.serializeUser(function(user, done) {//Create a cookie and store info in it.
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) { //Open a cookie and see the msg in it.
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });



//The Google authentication strategy authenticates users using a Google account and OAuth 2.0 tokens. 
//The client ID and secret obtained when creating an application are to be supplied as options when creating the strategy. 
//The strategy also requires a verify callback, which receives the access token and optional refresh token, as well as profile which contains the authenticated user's Google profile. The verify callback must call cb providing a user to complete authentication.
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {  //This is where ggl sends back access token,profile(email,ggl_id)
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) { //Using gggl_id to find user in our database. To use this function,we need mongoose-findorcreate.
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google",{ scope: ['profile'] }));   //Using google strategy for authentication through passport.Google strategy already setup in above using passport.
                                        //Scope asks for users password when logging in.


app.get('/auth/google/secrets',    //google sends request for this page so that users can see secrets
  passport.authenticate('google', { failureRedirect: '/login' }), //Authenticate locally by using info from ggl and save session.
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/login", function (req, res) {

    res.render("login");
    
});

app.get("/register", function (req, res) {

    res.render("register");
});

app.get("/secrets",function(req,res){
    //Looks through all secrets in the database and find the users with secrets.
    User.find({"secret":{$ne: null}},function(err,foundUsers){
        if(err)
        console.log(err);
        else
        {
            if(foundUsers)
            {
            res.render("secrets",{usersWithSecrets:foundUsers});
        }
    }
    });
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

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){   //If request is authenticated, i.e, request is made from the user who is already logged in.
        res.render("submit");
    }
    else  //If user is not authenticated.
    res.redirect("/login");
});

app.post("/submit",function(req,res){
    const submittedSecret=req.body.secret;  //secret is name of input in the form
    //Save the secret to database of a user.
    //When user is logged in only,he can submit.That means,we have info about logged in user in req.body.
    
    User.findById(req.user.id,function(err,foundUser){
        if(err)
        console.log(err);
        else{
        foundUser.secret=submittedSecret;
            foundUser.save(function(){
                res.redirect("/secrets");
            });
        }

    });
});

app.listen(3000, function () {
    console.log("Server started");
});