require('dotenv').config(); //No need to assign to constant.This package will automatically load env variables from env file into the process in which this package is actively running.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



const User = new mongoose.model("User", userSchema);


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {

    res.render("register");
});

//When user enters data and click register 
app.post("/register", function (req, res) {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) { //generates a salt and hashes our password along with the salt "saltRound" number of times.The hashed password is returned to hash variable in call back function.

        const newUser = new User({
            email: req.body.username,
            password: hash //Saving the hash of password
        });
        newUser.save(function (err) {
            if (!err)
                res.render("secrets");
            else
                console.log(err);
        });
    });


});

app.post("/login", function (req, res) {
    const userName = req.body.username;
    const password = req.body.password; //We compare the hash of password that the user entered with the hash present in database.

    User.findOne({
        email: userName
    }, function (err, foundUser) {
        if (err)
            console.log(err);
        else //No error
        {
            if (foundUser) { //We found the user in the database with entered username.
                bcrypt.compare(password, foundUser.password, function (err, result) {
                                                                         //We are comparing if the bcrypted version of password entered by user is equal to password in data base.If equal then result var is true else false 
                    if (result === true)
                        res.render("secrets");
                });
            }

        }
    });

});

app.listen(3000, function () {
    console.log("Server started");
});