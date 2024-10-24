module.exports.loggedin=((req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectURL=req.originalUrl;
        req.flash("error","Login required");
        res.redirect("/login");
    }
    next();
});
module.exports.redirectToPage=((req,res,next)=>{
    if(req.session.redirectURL){
        res.locals.redirectTo=req.session.redirectURL;
    }
    next();
})