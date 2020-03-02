var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var random_name = require('node-random-name');

let messages = [];
let users = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  
  function get_username()
  {
    let cookies = socket.handshake.headers.cookie;
    let username = random_name();
    if(cookies.includes("nickname="))
    {
      username = cookies.substr(cookies.indexOf("nickname=") + 9);
      username = username.substr(0, username.indexOf(";"));
      console.log("User with nickname connected: ", username);
    }
    else{
      socket.emit('username', username);
    }
    return username;
  }
  
  let user = get_username(true);
  users.push(user);
  console.log(user ,' connected');
  io.emit('user update', users);
  console.log(users);
  
  
  //send the message log from previous connections
  for (index in messages)
  {  	
  	console.log('sending message', messages[index]);
  	socket.emit('chat message', messages[index]);	
  }
  
  socket.on('disconnect', function(){
    console.log(users);
    let user_ind = users.indexOf(get_username());
    users.splice(user_ind,user_ind + 1);
  	//io.emit('user dis', get_username());
    console.log('user dis', get_username());
    //io.emit('user update', users);
  });
  
});


io.on('connection', function(socket){
  socket.on('chat message', function(messg, usr){
  	let tm = Date.now();
  	
  	//format message as object with time and message
  	let message = {time: tm, 
    msg: messg,
    user: usr, 
  	};
  	
  	messages.push(message);
  	console.log(message);
  	io.emit('chat message', message);
    //io.emit('chat message - content', msg);
  });
});

http.listen(5252, function(){
  console.log('listening on *:5252');
});


