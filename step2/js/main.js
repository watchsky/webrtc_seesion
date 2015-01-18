(function () {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    RTCPeerConnection = webkitRTCPeerConnection || mozRTCPeerConnection;
    RTCSessionDescription = RTCSessionDescription || mozRTCSessionDescription;
    RTCIceCandidate = RTCIceCandidate || mozRTCIceCandidate;

    var startBtn = document.getElementById('btn_start');
    var quitBtn = document.getElementById('btn_quit');
    var pcManager, socket = io.connect();

    socket.on('RequestMedia', function (fromUser) {
        pcManager.createPeerConnectionForUser(fromUser);
        pcManager.createOfferForUser(fromUser);
    });

    socket.on('Offer', function (offer, fromUser) {
        pcManager.createPeerConnectionForUser(fromUser);
        pcManager.createAnswerForUser(fromUser, offer);
    });

    socket.on('Answer', function (answer, fromUser) {
        var peer = pcManager.getPeer(fromUser);
        peer && peer.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('Candidate', function (candidate, fromUser) {
        var candidate = new RTCIceCandidate(candidate), peer = pcManager.getPeer(fromUser);
        peer && peer.peerConnection.addIceCandidate(candidate);
    });

    socket.on('SomeoneHasLeft', function (username) {
        pcManager.deletePeer(username);
        var containerDiv = document.getElementById('container');
        containerDiv.removeChild(document.getElementById(username));
    });

    startBtn.onclick = function () {
        var room = document.getElementById('room').value.trim();
        if (room === '') return;
        socket.emit('GetRoomStatus', room, function (roomStatus) {
            if (!roomStatus.isRoomFull) {
                var username = 'user' + Math.floor(Math.random() * 1000);
                socket.emit('JoinRoom', room, username, function () {
                    var constraints = {video: true, audio: true};
                    pcManager = new PeerConnectionManager(room, username, socket);
                    navigator.getUserMedia(constraints, pcManager.handleUserMedia.bind(pcManager), pcManager.handleUserMediaError);
                });
            } else {
                window.alert('The room is full, please choose another room.');
            }
        });
    };

    quitBtn.onclick = function () {
        var containerDiv = document.getElementById('container');
        for (var i = containerDiv.childNodes.length - 1; i >= 0; i--) {
            containerDiv.removeChild(containerDiv.childNodes[i]);
        }
        if (pcManager && pcManager.localStream) pcManager.localStream.stop();
        pcManager.socket.emit('LeaveRoom', pcManager.room, pcManager.host);
    };

})();

function PeerConnectionManager(room, host, socket) {
    this.room = room;
    this.host = host;
    this.socket = socket;
    this.peers = [];
}

PeerConnectionManager.prototype.handleUserMedia = function (stream) {
    var localVideo = document.createElement('video');
    localVideo.autoplay = true;
    localVideo.src = window.URL.createObjectURL(stream);
    document.getElementById('container').appendChild(localVideo);
    this.localStream = stream;
    this.socket.emit('SendRequestMedia', this.host, this.room);
};

PeerConnectionManager.prototype.handleUserMediaError = function (error) {
    console.log('Get User Media Error. Error: ', error);
};

PeerConnectionManager.prototype.createPeerConnectionForUser = function (username) {
    if (!this.getPeer(username)) {
        var peer = new Peer(username, this);
        this.peers.push(peer);
    }
};

PeerConnectionManager.prototype.getPeer = function (username) {
    for (var index = 0; index < this.peers.length; index++) {
        if (this.peers[index].username === username) return this.peers[index];
    }
    return null;
};

PeerConnectionManager.prototype.deletePeer = function (username) {
    var i;
    for (i = 0; i < this.peers.length; i++) {
        if (this.peers[i].username === username) break;
    }
    this.peers.splice(i, 1);
};

PeerConnectionManager.prototype.createOfferForUser = function (username) {
    var peer = this.getPeer(username);
    if (peer) {
        peer.createOffer();
    }
};

PeerConnectionManager.prototype.createAnswerForUser = function (username, message) {
    var peer = this.getPeer(username);
    if (peer) {
        peer.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        peer.createAnswer();
    }
};

function Peer(username, pcManager) {
    this.username = username;
    this.pcManager = pcManager;
    this.peerConnection = new RTCPeerConnection(null);
    this.configPeerConnection();
}

Peer.prototype.configPeerConnection = function () {
    this.peerConnection.onicecandidate = this._handleIceCandidate.bind(this);
    this.peerConnection.onaddstream = this._handleRemoteStreamAdded.bind(this);
    this.peerConnection.onremovestream = this._handleRemoteStreamRemoved.bind(this);
    this.peerConnection.addStream(this.pcManager.localStream);
};

Peer.prototype.createOffer = function () {
    this.peerConnection.createOffer(this._setLocalAndSendOffer.bind(this), this._handleCreateOfferError);
};

Peer.prototype.createAnswer = function () {
    var sdpConstraints = {'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true }};
    this.peerConnection.createAnswer(this._setLocalAndSendAnswer.bind(this), null, sdpConstraints);
};

Peer.prototype._handleIceCandidate = function (event) {
    if (event.candidate) {
        var candidate = {sdpMLineIndex: event.candidate.sdpMLineIndex, candidate: event.candidate.candidate};
        this.pcManager.socket.emit('SendCandidate', candidate, this.pcManager.host, this.username, this.pcManager.room);
    } else {
        console.log('End of candidates.');
    }
};

Peer.prototype._handleRemoteStreamAdded = function (event) {
    this.stream = event.stream;
    this.createVideoElement();
};

Peer.prototype.createVideoElement = function () {
    var remoteVideo = document.createElement('video');
    remoteVideo.id = this.username;
    remoteVideo.autoplay = true;
    remoteVideo.src = window.URL.createObjectURL(this.stream);
    document.getElementById('container').appendChild(remoteVideo);
};

Peer.prototype._handleRemoteStreamRemoved = function (event) {
    console.log('Remote stream removed. Event: ', event);
};

Peer.prototype._setLocalAndSendOffer = function (sessionDescription) {
    this.peerConnection.setLocalDescription(sessionDescription);
    this.pcManager.socket.emit('SendOffer', sessionDescription, this.pcManager.host, this.username, this.pcManager.room);
};

Peer.prototype._setLocalAndSendAnswer = function (sessionDescription) {
    this.peerConnection.setLocalDescription(sessionDescription);
    this.pcManager.socket.emit('SendAnswer', sessionDescription, this.pcManager.host, this.username, this.pcManager.room);
};

Peer.prototype._handleCreateOfferError = function (event) {
    console.log('Create Offer Error. Event: ', event);
};
