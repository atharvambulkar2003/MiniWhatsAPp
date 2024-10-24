const express=require("express");
const app=express();
const path=require("path");
const ExpressError=require("./ExpressError.js");
var methodOverride = require('method-override')
const session=require("express-session");
const MongoStore=require("connect-mongo");
const {loggedin,redirectToPage}=require("./middleware.js");
const dburl=process.env.ATLASDB

if(process.env.NODE_ENV!="production"){
    require("dotenv").config();
}
const store=MongoStore.create({
    mongoUrl:dburl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600,
})
store.on("error",()=>{
    console.log("Error in mongo session",err);
});
const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true
    }
};

const flash=require("connect-flash");
app.use(flash());
app.use(methodOverride('_method'))
app.use(session(sessionOptions));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
const Chat=require("./models/chat.js");
const mongoose = require('mongoose');
const User = require('./models/user.js');
const passport=require("passport");
const LocalStratergy=require("passport-local");
const ejsMate=require("ejs-mate");

main()
.then(
    (res)=>{
        console.log("Connection successful");
    }
).catch(err => console.log(err));

async function main() {
  await mongoose.connect(dburl);
}

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    next();
});
app.use((req,res,next)=>{
    res.locals.error=req.flash("error");
    next();
})
app.engine("ejs",ejsMate);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
    res.locals.userInfo=req.user;
    next();
})
app.get("/chats",loggedin,async(req,res,next)=>{
    try{
        let chats= await Chat.find();
        res.render("index.ejs",{chats});
    }catch(err){
        next(err);
    }
});



app.post("/posts",async(req,res,next)=>{
    try{
        let{from,to,msg}=req.body;
        let chat2=new Chat(
            {
                from:from,
                to:to,
                msg:msg,
                created_at:new Date()
            }
        )
        chat2.owner=res.locals.userInfo._id;
        await chat2.save()
        req.flash("success","Added successfully");
        res.redirect("/chats");
    }catch(err){
        next(err);
    }
});

function asyncWrap(fn){
    return function(req,res,next){
        fn(req,res,next).catch((err)=>{next(err)});
    }
}

app.delete("/chats/:id",loggedin,(req,res,next)=>{
    try{
        let {id}=req.params;
        Chat.findByIdAndDelete(id)
        .then((req)=>{console.log("Deleted");})
        .catch((err)=>{console.log(err)});
        req.flash("success","Deleted Successfully");
        res.redirect("/chats");
    }catch(err){
        next(err);
    }
})

app.get("/chats/new",loggedin,(req,res,next)=>{
    try{
       res.render("new.ejs");
    }catch(err){
        next(err);
    }
});

app.get("/chats/:id/edit",loggedin,async(req,res,next)=>{
    try{
        let {id}=req.params;
        let data=await Chat.findById(id);
        res.render("edit.ejs",{data});
    }catch(err){
        next(err);
    }
});

//show route
app.get("/chats/:id",asyncWrap(async(req,res,next)=>{
        let {id}=req.params;
        let data=await Chat.findById(id);
        if(!data){
            next(new ExpressError(404,"Chats not found"));
        }
        res.render("edit.ejs",{data});
}));

app.patch("/chats/:id",(req,res,next)=>{
    try{
        let {id} =req.params;
        let {msg:newMsg}=req.body;
        Chat.findByIdAndUpdate(id,{msg:newMsg},{runValidators:true})
        .then(
            (res)=>{console.log("Updated")}
        )
        .catch(
            (err)=>{console.log(err);}
        );
        req.flash("success","Updated Successfully");
        res.redirect("/chats");
    }catch(err){
        next(err);
    }
});
//user routes
app.get("/signup",asyncWrap((req,res,next)=>{
    try{
        res.render("signup.ejs");
    }
    catch(err){
        next(err);
    }
}));
app.post("/signup",async(req,res,next)=>{
    try{
        let{username,password,email}=req.body;
        const NewUser=new User({username,email});
        let result=await User.register(NewUser,password);
        req.login(result,(err)=>{
            if(err){
                return next(err);
            }
            req.flash("success","New User Registered");
            res.redirect("/chats");
        });
    }catch(err){
        req.flash("success",err.message);
        res.redirect("/signup");
    }
});
app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","logout successfully!");
        res.redirect("/chats");
    });
});
app.post("/login",redirectToPage,passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),asyncWrap((req,res,next)=>{
    
    req.flash("success","Login successfully");
    let newRedirect=res.locals.redirectTo||"/chats";
    res.redirect(newRedirect);
}));
app.get("/login",asyncWrap((req,res,next)=>{
    res.render("login.ejs");
}));
function validateError(err){
    console.log("This is validation error");
    console.log(err.message);
    return err;
}
//mongoose error
app.use((err,req,res,next)=>{
    if(err.name==="ValidationError"){
        err=validateError(err);
    }
    next(err);
});

//custom error handler and it is global for all
app.use((err,req,res,next)=>{
    let{status=403,message="Error occured"}=err;
    res.status(status).send(message);
});

app.listen(8081,()=>{
    console.log("App is listening on port 8081");
});