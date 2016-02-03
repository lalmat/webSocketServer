var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

// -----------------------------------------------------------------------------
// Paramétrages
var port      = 1337;           // Listening port
var userAry   = new Array();    // Array of users tokens allowed for connexion
var roomCount = new Array();    // Array of rooms with number of user connected to.
var gcTimeout = 5;              // Garbage Collector Interval (in sec.)
var cxTimeout = 30;             // Max duration allowed to connect (in sec.)

// -----------------------------------------------------------------------------
// Configuration
//io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling', 'htmlfile', 'flashsocket']);
io.set('origins', '*:*');
app.listen(port);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  socket.on('disconnect', function() {
      console.log("Disconnecting "+socket.uid);
      if (socket.uid) {
        var i = userAry.indexOf(socket);
        userAry.splice(i);
        io.emit("msg", {uid:socket.uid, login:socket.login, action:'DISCONNECTED', data:null});
      }
    });

    socket.on('login', function(data) {
      console.log("Connected "+socket.uid);
      socket.login = data;
      socket.uid   = hashCode(data);
      userAry[socket.uid] = socket;
      io.emit("msg", {uid:socket.uid, login:socket.login, action:'NEWUSER', data:null});
    });

    socket.on('msg', function(syncData){
      console.log("Message:",syncData)
      if (socket.uid) {
        io.sockets.emit("sync", {uid:socket.uid, login:socket.login, action:syncData.action, data:syncData.data});
      }
    });

    console.log("New connexion");
});

console.log("Server ready");

function hashCode(str){
	var hash = 0;
	if (str.length == 0) return hash;
	for (i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
