require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

// Mongo Db connection
const connectURL = "mongodb://localhost:27017/blogHomie";
// const connectURI = process.env.MONGODB_URI;
mongoose.connect(connectURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(
        console.log("[Status] Connection Succesfull")
    )
    .catch(
        (error) => {
            console.error(error);
        });

// Setting the view engine and body parser
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
// app.set("views", "views");
app.set("views", __dirname + "/views");
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Blog Schema definiton and new model creation
const blogSchema = {
    title: String,
    content: String
}

const Blog = mongoose.model("Blog", blogSchema);
const userSchema = mongoose.Schema({
    googleId: String
});
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

const messageSchema = {
    Name: String,
    Email: String,
    Message: String
}

const Message = mongoose.model("Message", messageSchema);

// Getting the date and formatting it
let date = new Date();


const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}

let day = date.toLocaleDateString("en-US", options)

// Creating a new Blog to send to db

const post1 = {
    title: "New Day",
    content: "This is my blog site and I have been working on it since last 6 days"
};

Blog.find().then(Blogs => {
    if (Blogs == 0) {
        Blog.create(post1).then(console.log("[Status] Entry Created Successfully")).catch((error) => { console.log(error) });
    }
    else {
        console.log("[Status] Entry Exists Already");
    }
});

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/compose",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOne({ googleId: profile.id })
            .then((user) => {
                return cb(null, user);
            })
            .catch((err) => {
                return cb(err, null);
            });
    }
));
// Contact-Us from collection

let messages = [];

// Routes declaration starts

app.get("/", (req, res) => {
    Blog.find().then(Blogs => {
        console.log(Blogs[0])
        res.render("home", { dateAndDay: day, postContent: Blogs });
    })
});
app.get("/about", (req, res) => {
    res.render("about", { dateAndDay: day });
})

app.get("/contact", (req, res) => {
    res.render("contact");
})

app.get("/compose", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("compose");
    } else {
        res.redirect("/login");
    }
})

app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/auth/google", passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/compose", passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect("/compose");
    }
);
app.post("/compose", (req, res) => {

    const post = {
        title: req.body.title,
        content: req.body.content
    }
    Blog.create(post);
    console.log(posts);
    res.redirect("/");
})

app.post("/contact", (req, res) => {
    const message = {
        Name: req.body.name,
        Email: req.body.email,
        Message: req.body.message
    }
    Message.create(message);
    console.log(message);
    res.redirect("/success");
})

app.get("/success", (req, res) => {
    res.render("success")
})
app.get("/post", (req, res) => {
    res.render("post", { postContent: posts, dateAndDay: day });
})

app.get("/post/:title", (req, res) => {
    const postTitle = req.params.title;
    const lowerCasePostTitle = lodash.lowerCase(postTitle);
    Blog.find().then(Blogs => {
        const titles = [];
        for (var i = 0; i < Blogs.length; i++) {
            const postTitle = Blogs[i].title;
            const lowerCasePostTitle = lodash.lowerCase(postTitle);
            titles.push(lowerCasePostTitle);
            console.log(lowerCasePostTitle);
        }
        console.log(titles);
        Blogs.forEach((Blog) => {
            const storedTitle = lodash.lowerCase(Blog.title);
            if (storedTitle === lowerCasePostTitle) {
                console.log("[Search] Success-200 : Match Found");
                res.render("post", { postTitle: Blog.title, postBody: Blog.content, dateAndDay: day });
            }
        })
    })
})

// Listening on the port

app.listen(process.env.PORT || 3000, () => {
    console.log("[Status] The server is running on port: " + process.env.PORT);
})
