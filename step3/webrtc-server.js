var socketIO = require('socket.io');

function WebRTCServer() {
    this.MAX_MEMBERS_FOR_EVERY_ROOM = 4;
    this.users = [];
}

WebRTCServer.prototype.listen = function (httpServer) {
    var self = this;

    var io = socketIO.listen(httpServer);
    io.sockets.on('connection', function (socket) {

        socket.on('GetServerStatus', function (callback) {
            if (typeof callback === 'function') {
                callback({currentUserCount: self.users.length, isRoomFull: self.users.length >= self.MAX_MEMBERS_FOR_EVERY_ROOM});
            }
        });

        socket.on('JoinRoom', function (username, callback) {
            if (!self.getUser(username)) {
                self.addUser(username, socket);
                typeof callback === 'function' && callback(true);
            } else {
                typeof callback === 'function' && callback(false);
            }
        });

        socket.on('SendRequestMedia', function (username) {
            for (var i = 0; i < self.users.length; i++) {
                var user = self.users[i];
                if (user.username !== username) user.socket.emit('RequestMedia', username);
            }
        });

        socket.on('SendOffer', function (offer, fromUser, toUser) {
            var user = self.getUser(toUser);
            user && user.socket.emit('Offer', offer, fromUser);
        });

        socket.on('SendAnswer', function (answer, fromUser, toUser) {
            var user = self.getUser(toUser);
            user && user.socket.emit('Answer', answer, fromUser);
        });

        socket.on('SendCandidate', function (candidate, fromUser, toUser) {
            var user = self.getUser(toUser);
            user && user.socket.emit('Candidate', candidate, fromUser);
        });
    });
};

WebRTCServer.prototype.getUser = function (username) {
    for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].username == username) return this.users[i];
    }
    return null;
};

WebRTCServer.prototype.addUser = function (username, socket) {
    this.users.push({username: username, socket: socket});
};

module.exports = WebRTCServer;
