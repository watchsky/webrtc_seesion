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

        socket.on('GetRoomStatus', function (roomName, callback) {
            var room = self.getRoom(roomName);
            var currentUserCount = room ? room.getUsers().length : 0;
            if (typeof callback === 'function') {
                callback({currentUserCount: currentUserCount, isRoomFull: currentUserCount >= self.MAX_MEMBERS_FOR_EVERY_ROOM});
            }
        });

        socket.on('JoinRoom', function (roomName, username, callback) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                room.addUser(username, socket);
            } else {
                var newRoom = new Room(roomName);
                newRoom.addUser(username, socket);
                self.addRoom(newRoom);
            }
            typeof callback === 'function' && callback();
        });

        socket.on('SendRequestMedia', function (fromUser, roomName) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                var users = room.getUsers();
                for (var i = 0; i < users.length; i++) {
                    if (users[i].username !== fromUser) users[i].socket.emit("RequestMedia", fromUser);
                }
            }
        });

        socket.on('SendOffer', function (offer, fromUser, toUser, roomName) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                var user = room.getUser(toUser);
                if (user !== null) user.socket.emit("Offer", offer, fromUser);
            }
        });

        socket.on('SendAnswer', function (answer, fromUser, toUser, roomName) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                var user = room.getUser(toUser);
                if (user !== null) user.socket.emit("Answer", answer, fromUser);
            }
        });

        socket.on('SendCandidate', function (candidate, fromUser, toUser, roomName) {
            var room = self.getRoom(roomName);
            if (room !== null) {
                var user = room.getUser(toUser);
                if (user !== null) user.socket.emit("Candidate", candidate, fromUser);
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
