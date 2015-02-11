# webrtc_seesion

本程序用原生的浏览器（目前只支持高版本的Chrome和Firefox）javascript API一步步构建一个简单的支持多人在线视频的小应用。
本程序用到了node的express框架构建后台，用socket.io进行前后端的通信，用webrtc技术实现视频通信。

    本程序分为3个子程序，它们之间是循序渐进的关系。
    （1）step1子程序展示了如何用javascript API获取摄像头视频的流程；
    （2）step3子程序展示了如何用webrtc技术实现视频通信的流程，同时构建了一个支持4个人同时在线视频的小程序；
    （3）step2子程序展示了如何构建一个支持多人、多组在线视频的程序，不同的视频组用不同的房间号标识。

多人在线视频程序示例[https://simple-rtc.herokuapp.com/](https://simple-rtc.herokuapp.com/)。
