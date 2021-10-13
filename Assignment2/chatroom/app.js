
 const express = require('express');  
 const app = express();               // Create an express instance and assign it to app.
 const server = require('http').Server(app);  
 const io = require('socket.io')(server);     //Add the monitoring of the socket to the module set by the app.
 const path = require('path');        // This is the path processing module of node, which can format the path
 
 const MongoClient = require('mongodb').MongoClient; //Create a MongoClient object, and then configure the specified URL and port number
 const url = "mongodb://localhost:27017/DATEBASE_CHATROOM";
  
 const onlineUsers = [];              //People currently online
 let usersNum = 0;                    //Count the number of people logged in online
 
 server.listen(3000,()=>{                
     console.log("server running at 127.0.0.1:3000");// On behalf of listening to port 3000, and then execute the callback function to output on the console. 
 });  
 
 
 /**
 * app.get(): A middleware in express that is used to match get requests. The simple point is the route that node processes the request. 
 * For different URL requests, let the corresponding different app.get() handle them.
*'/': It matches the root route of the get request.'/' which is 127.0.0.1:3000/ matches it
* req takes the request object of the table browser, res represents the return object of the server
  */
 app.get('/',(req,res)=>{
     res.redirect('/static/chat.html');      // The redirect function of express. If the browser requests the root route'/', the browser will redirect him to the route '127.0.0.1:3000/chat.html'
 });
 
 /** 
* __dirname represents the absolute path of the current file, so we use path.join to add the absolute path of app.js and public to get the absolute path of public.
   * Path.join is used to avoid strange paths like ././public
   * express.static helps us host the static resources in the public folder.
   * As long as there is a path of 127.0.0.1:3000/XXX/AAA, it will go to the public folder to find the AAA file in the XXX folder and send it to the browser.
  */  
 app.use('/static',express.static(path.join(__dirname,'./public')));          
 
 
 /*socket*/  
 io.on('connection',(socket)=>{              //Monitor client connection events 
       
     socket.on('login',(data)=>{  
         checkUser(data,socket);
     });  
     /** 
      * Listening to sendMessage, we get the message in the data from the client and store it together.
      */  
     socket.on('sendMessage',(data)=>{  
         for(let _user of onlineUsers) {  
             if(_user.username === data.username) {  
                 _user.message.push(data.message);  
                 //After the information is stored, receiveMessage is triggered to send the information to all browsers-broadcast event
                 io.emit('receiveMessage',data);  
                 break;  
             }  
         }  
     });  
     //Things to do after disconnecting  
     socket.on('disconnect',()=>{          //Note that this event does not require a custom trigger, the system will automatically call
         usersNum = onlineUsers.length; 
         console.log(`Number of currently online logins：${usersNum}`);  
     });  
 });  
 //Add online people
 const addOnlineUser = (data) => {
     onlineUsers.push({  
         username: data.username,  
         message: []  
     });
     usersNum = onlineUsers.length;
     console.log(`User${data.username}login，Welcome to Alex's chat room，Number of people currently online：${usersNum}`);  
 }
 //Database operations are asynchronous operations, which are simply encapsulated using promises.
  //Asynchronously encapsulate the database connection and open the collection userlist
 const connectDB = () => {
     return new Promise((resolve,reject) => {
         MongoClient.connect(url, function(err, db) {
             if (err) {
                 reject(err);  
             }
             const dbo = db.db("DATABASE_CHATROOM");
             const collection = dbo.collection("userlist");
             resolve({
                 db:db,
                 collection:collection
             });
         });
     });
 }
 //Asynchronous package to detect whether the user name has been registered
 const isRegister = (dbObj,name) => {
     return new Promise((resolve,reject) => {
         dbObj.collection.find({username:name}).toArray(function(err, result) {
             if (err) {
                 reject(err);  
             }
             resolve(Object.assign(dbObj,{result:result}));
         });
     });
 }
 //Asynchronous package registration to add new users
 const addUser = (dbObj,userData) => {
     return new Promise((resolve,reject) => {
         const myobj = userData;
         dbObj.collection.insertOne(myobj, function(err, res) {
             if (err) {
                 reject(err);  
             }
             resolve(Object.assign(dbObj,res));
             dbObj.db.close();
         });
     });
 }
 
//Check logic:
  //1. Is the user logged in? Has logged in return code=3
 const isLogin = (data) => {
     let flag = false;
     onlineUsers.map((user) => {
         if(user.username === data.username){
             flag = true;
         }
     });
     return flag;
 }
 //2. Whether the user has been registered, if it is already registered, verify that the password is correct, 
 //if the password is correct, return code=0, if the password is incorrect, return code=1, if not registered, return code=2.
 const checkUser = (data,socket) => {
     connectDB().then(dbObj => {
         return isRegister(dbObj,data.username);
     }).then(dbObj => {
         const userData = dbObj.result || [];
         if(userData.length > 0){
             if(userData[0].password === data.password){
                 if(isLogin(data)){
                     socket.emit('loginResult',{code:3});
                 }
                 else{
                     addOnlineUser(data);
                     socket.emit('loginResult',{code:0});
                 }
             }
             else{
                 socket.emit('loginResult',{code:1});
             }
             dbObj.db.close();
         }
         else{
             addUser(dbObj,data).then(resolve => {
                 addOnlineUser(data);
                 socket.emit('loginResult',{code:'2-0'});
             },reject => {
                 socket.emit('loginResult',{code:'2-1'});
             });
         }
         
     });
 }