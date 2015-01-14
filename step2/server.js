var http = require('http');
var fs = require('fs');
var path = require('path');
var WebRTCServer = require('./webrtc-server.js');

var httpServer = http.createServer(function (req, res) {
    if (req.url === '/' || req.url === '/index') {
        render('index.html', 'text/html', res);
    }
    var ext = req.url.split('.').pop(),
        contentType;
    if (ext === 'html' || ext === 'htm') {
        contentType = 'text/html';
    } else if (ext === 'js') {
        contentType = 'text/javascript; charset=utf-8';
    } else {
        contentType = 'text/plain';
    }
    render(req.url, contentType, res);

    console.log('Request: ' + req.url);
}).listen(8888, '127.0.0.1');

var webrtcServer = new WebRTCServer();
webrtcServer.listen(httpServer);

console.log('Server running at http://127.0.0.1:8888/');

function render(url, contentType, res) {
    fs.readFile(path.join(__dirname, url), function (err, data) {
        if (err) {
            res.end('request error');
        } else {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(data);
        }
    });
}

