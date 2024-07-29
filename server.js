const express = require("express");

const { ExpressPeerServer } = require("peer");

const app = express();

app.use(express.static("public"));

const listener = app.listen(443, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// peerjs server
const peerServer = ExpressPeerServer(listener, {
  debug: true,
  path: '/myapp'
});

app.use('/peerjs', peerServer);
