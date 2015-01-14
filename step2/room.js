function Room(roomName) {
    this.roomName = roomName;
    this.users = [];
}

Room.prototype.addUser = function (username, socket) {
    this.users.push({"username": username, "socket": socket});
};

Room.prototype.deleteUser = function (username) {
    var index;
    for (index = 0; index < this.users.length; index++) {
        if (this.users[index].username == username)
            break;
    }
    this.users.splice(index, 1);
};

Room.prototype.getUsers = function () {
    return this.users;
};

Room.prototype.getUser = function (username) {
    var index;
    for (index = 0; index < this.users.length; index++) {
        if (this.users[index].username == username) {
            return this.users[index];
        }
    }
    return null;
};

module.exports = Room;