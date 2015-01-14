var socketIO = require('socket.io');
var Room = require('./room.js');

function WebRTCServer() {
    this.MAX_MEMBERS_FOR_EVERY_ROOM = 4;
    this.rooms = [];
}

WebRTCServer.prototype.listen = function (httpServer) {
    var self = this;

    var io = socketIO.listen(httpServer);
    io.sockets.on('connection', function (socket){

        socket.on('GetUserNumbersOfRoom', function (roomName) {
            var room = self.getRoom(roomName);
            var userNumber = room ? room.getUsers().length : 0;
            socket.emit('ReturnUserNumber', roomName, userNumber);
        });

        socket.on('JoinRoom', function (roomName, username) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                room.addUser(username, socket);
            } else {
                var newRoom = new Room(roomName);
                newRoom.addUser(username, socket);
                self.addRoom(newRoom);
            }
            socket.emit('JoinRoomSuccessfully', roomName, username);
        });

        socket.on('SendMessage', function (message, fromUser, toUser, roomName) {
            var room = self.getRoom(roomName);
            if (room === null) return;

            if (toUser === "_all") {
                var users = room.getUsers();
                for (var i = 0; i < users.length; i++) {
                    if (users[i].username === fromUser) continue;
                    users[i].socket.emit("Message", message, fromUser);
                }
            } else {
                var user = room.getUser(toUser);
                if (user !== null) user.socket.emit("Message", message, fromUser);
            }
        });

        socket.on('LeaveRoom', function (roomName, username) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                room.deleteUser(username);
                var users = room.getUsers();
                if (users.length === 0) {
                    self.deleteRoom(roomName);
                } else {
                    for (var i = 0; i < users.length; i++) {
                        users[i].socket.emit("SomeoneHasLeft", username);
                    }
                }
            }
        });
    });
};

WebRTCServer.prototype.getRoom = function (roomName) {
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].roomName == roomName) return this.rooms[i];
    }
    return null;
};

WebRTCServer.prototype.addRoom = function (room) {
    this.rooms.push(room);
};

WebRTCServer.prototype.deleteRoom = function (roomName) {
    var i;
    for (i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].roomName == roomName) break;
    }
    this.rooms.splice(i, 1);
};

module.exports = WebRTCServer;
