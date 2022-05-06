const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const FakeDataGenerator = require('fake-data-generator-taiwan');

app.use(express.static('public'))

//自動生成名稱物件
let generator = new FakeDataGenerator();
//存放使用者資訊
let Name = {};

//使用者連線時
io.on('connection', (socket) => {
  //隨機產生名稱
  Name[socket.id] = generator.Name.generate();;
  //加入名稱為房名的房間
  socket.join(Name[socket.id]);

  //新用戶取得目前在線上用戶資訊
  for (const [key, value] of Object.entries(Name)) {
    if (key != socket.id) {
      socket.emit('currUserOnline', value);
    }
  }
  //舊用戶取得新用戶上限資訊
  socket.broadcast.emit('newUserOnline', Name[socket.id]);

  //用戶密語功能
  socket.on('secretTalk', (msg) => {
    console.log(msg.split(" "))
    io.to(msg.split(" ")[1]).emit('secretTalk', msg.split(" ")[2]);
  });

  //取得隨機中文名字
  socket.emit('selfName', Name[socket.id]);

  //用戶聊天功能
  socket.on('chatMessage', (msg, callback) => {
    if (msg.length >= 40) {
      callback({
        status: false
      })
      return
    }
    else {
      io.emit('chatMessage', msg);
    }
  });
  //用戶正在輸入訊息
  socket.on('userTyping', (msg) => {
    socket.broadcast.emit('userTyping', Name[socket.id]);
  });
  //用戶輸入結束
  socket.on('userTypeEnd', (msg) => {
    socket.broadcast.emit('userTypeEnd', Name[socket.id]);
  });
  //用戶離線
  socket.on('disconnect', () => {
    io.emit('userDisconnected', Name[socket.id]);
    delete Name[socket.id];
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('listening on *:3000');
});