(function () {
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function successCallback(localMediaStream) {
        window.stream = localMediaStream; // stream available to console
        var video = document.getElementById('localVideo');
        video.src = window.URL.createObjectURL(localMediaStream);
        video.play();
    }

    function errorCallback(error) {
        window.alert('Error: can not get video from webcam');
    }

    var getVideoButton = document.getElementById('getVideo'),
        pauseVideoButton = document.getElementById('pauseVideo'),
        replayVideoButton = document.getElementById('replayVideo');

    getVideoButton.onclick = function () {
        var constraints = {video: true};  //http://tools.ietf.org/html/draft-alvestrand-constraints-resolution-00#page-4
        navigator.getUserMedia(constraints, successCallback, errorCallback);
    };
    pauseVideoButton.onclick = function () {
        var video = document.getElementById('localVideo');
        if (video && !video.paused) video.pause();
    };
    replayVideoButton.onclick = function () {
        var video = document.getElementById('localVideo');
        if (video && video.paused) video.play();
    };
})();