var  yetify = require('yetify'),
    config = require('getconfig'),
    //socketIO = require('socket.io'),
    fs = require('fs'),
    sockets = require('./sockets'),
    port = parseInt(process.env.PORT || config.server.port, 10),
    server_handler = function (req, res) {

        //Trim arguments
        var url = req.url.split('?')[0];

        //Try to get target peer mode to show appropriate page
        var peerMode;
        var multicastType;
        var splitted = url.split('/');
        if (splitted.length > 2) {
            var IO = sockets.io;
            var roomName = splitted[1];
            var peerId = splitted[2];

            //Get peer mode to determine page content
            if (IO) {
                var targetPeer = IO.sockets.adapter.nsp.connected[peerId];
                if (!targetPeer) {  //Try to find by nickname
                    var room = IO.sockets.adapter.rooms[roomName];
                    if (room) {
                        for (var id in room) {
                            var peer = IO.sockets.adapter.nsp.connected[id];
                            if (peer && peer.customProps && peer.customProps.nickName && peer.customProps.nickName == peerId)
                                targetPeer = peer;
                        }
                    }
                }
            }
            if (targetPeer && targetPeer.customProps) {
                if (targetPeer.customProps.mode)
                    peerMode = targetPeer.customProps.mode;
                if (targetPeer.customProps.multicastType)
                    multicastType = targetPeer.customProps.multicastType;
            }
        }

        var content;
        var fs = require('fs');
        if (req.url.indexOf("style.css") != -1) {
            res.writeHead(200, { "Content-Type": "text/css" });
            content = fs.readFileSync('css/style.css');
        }
        else if (req.url.indexOf("simplewebrtc.bundle.js") != -1) {
            res.writeHead(200, { "Content-Type": "text/javascript" });
            content = fs.readFileSync('js/simplewebrtc.bundle.js');
        }
        else if (req.url.indexOf("jquery.min.js") != -1) {
            res.writeHead(200, { "Content-Type": "text/javascript" });
            content = fs.readFileSync('js/jquery.min.js');
        }
        else if (splitted.length > 2) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            if (peerMode && peerMode.toLowerCase() == 'sender') {
                if (multicastType == 'janus')
                    content = fs.readFileSync('Receiver_janus.html');
                else
                    content = fs.readFileSync('Receiver.html');
            }
            else if (peerMode && (peerMode.toLowerCase() == 'any' || peerMode.toLowerCase() == 'duplex'))
                content = fs.readFileSync('Duplex.html');
            else
                content = fs.readFileSync('Preview.html');
        }

        res.end(content);

    },

    server = null;

// Create an http(s) server instance to that socket.io can listen to
if (config.server.secure) {
    server = require('https').Server({
        key: fs.readFileSync(config.server.key),
        cert: fs.readFileSync(config.server.cert),
        passphrase: config.server.password
    }, server_handler);
} else {
    server = require('http').Server(server_handler);
}
server.listen(port);

sockets.ListenSocket(server, config);

if (config.uid) process.setuid(config.uid);

var httpUrl;
if (config.server.secure) {
    httpUrl = "https://localhost:" + port;
} else {
    httpUrl = "http://localhost:" + port;
}
console.log(yetify.logo() + ' -- signal master is running at: ' + httpUrl);
