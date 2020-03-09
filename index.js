var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var random_name = require('node-random-name');

let messages = [];
let users = [];
let clr_exp = new RegExp('[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3}'); //color reg expression

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

function get_user(id)
  {
    for(let i = 0; i < users.length; i++){
      console.log(users[i].id);
      console.log(id);
      if(users[i].id === id){
        console.log("user found");
        return users[i];
      }
    }
    console.log("unable to find user");
    return null;
  }


io.on('connection', function(socket){
  
  function get_username()
  {
    return users.username;
  }


  function get_id(){
    try{
    let cookies = socket.handshake.headers.cookie;
    let id = Math.floor(Math.random() * 53232);
    if(cookies.includes("user_id="))
    {
      id = cookies.substr(cookies.indexOf("user_id") + 8);
      id = id.substr(0, id.indexOf(";"));
      console.log("User with id connected: ", id);
    }
    else{
      socket.emit('user_id', id);
    }
      return parseInt(id);
    }
    catch(Exception){
      console.log("failed to get user id");
      return null;
    }
  }


  let id = get_id();
  let found = false;
  for(let i = 0; i < users.length; i++){
      if(users[i].id === get_id()){
        users[i].connected = true;
        console.log("user reconnected");
        found = true;
      }
  }
  if(!found)
  {
    let user = {
      'id': id,
      'username': "guest"+id,
      'color': "#00008b",
      'connected': true,
    }
    users.push(user);
  }
  //console.log(user ,' connected');
  io.emit('user update', users);
  console.log(users);
  
  
  //send the message log from previous connections
  for (index in messages)
  {
  	console.log('sending message', messages[index]);
  	socket.emit('chat message', messages[index]);	
  }
  
  socket.on('disconnect', function(){
    console.log("USERS: "+ users[0].id);
    console.log("USER ID:" + get_id());

    for(let i = 0; i < users.length; i++){
      if(users[i].id === get_id()){
        users[i].connected = false;
        console.log("user disconnected");
      }
      io.emit('user update', users);
    }
  });
  
});


io.on('connection', function(socket){
  socket.on('chat message', function(messg, id){
  	let tm = Date.now();
    let user = get_user(parseInt(id));

    if(messg.startsWith("/nick ")){
      console.log("user attempting to change username");
      let nick = messg.substr(6);
      if(users.some(_user => _user.username === nick && _user.connected)){
        socket.emit("Error", "Nickname already taken!");
      }
      else
      {
        user.username = nick;
        io.emit('user update', users);
      }
    }
    else if(messg.startsWith("/nickcolor ")){
      console.log("user attempting to change nick color");
      let color = messg.substring(11);
      if(clr_exp.test(color)){
        user.color = "#"+color;
        io.emit('user update', users);
      }
      else{
        socket.emit('Error', "Color code not recognized (please use hex color code format)");
        console.log("Color code format not correct");
      }
    }
    else if(messg.startsWith("/")){
      socket.emit('Error', "Code not recognized");
    }
    else{
  	  //format message as object with time and message
  	  let message = {
        time: tm,
        msg: messg,
        user: id,
        username: user.username,
        color: user.color
      };

  	  messages.push(message);
  	  console.log(message);
  	  io.emit('chat message', message);
    }
    //io.emit('chat message - content', msg);
  });
});

http.listen(5252, function(){
  console.log('listening on *:5252');
});


