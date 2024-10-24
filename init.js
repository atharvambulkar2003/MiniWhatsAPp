const mongoose = require('mongoose');
const Chat=require("./models/chat.js");

main()
.then(
    (res)=>{
        console.log("Connection successful");
    }
).catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/fakewhatsApp');
}

let allChats=[
    {
        from:"Papiha",
        to:"punam",
        msg:"please bring choclates",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
    {
        from:"mohit",
        to:"aayush",
        msg:"please write code",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
    {
        from:"manohar",
        to:"sunil",
        msg:"lets go to mahur",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
    {
        from:"dhynesh",
        to:"chinmay",
        msg:"give me notes",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
    {
        from:"lata",
        to:"rekha",
        msg:"start call",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
    {
        from:"mangesh",
        to:"suresh",
        msg:"lets study",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
    {
        from:"vedika",
        to:"sanskar",
        msg:"lets go to home",
        created_at:new Date(),
        owner:"6717ac45e898df7d82511389"
    },
];
let initData=async()=>{
    let res=await Chat.deleteMany({});
    await Chat.insertMany(allChats);
    console.log("data was initialized fully");
}
initData();
