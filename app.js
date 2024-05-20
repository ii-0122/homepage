const conn = require("./maria.js");
var express = require("express");
const { get } = require("express/lib/response");
var ejs = require("ejs");
var fs = require("fs");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var nsp_chatRoom = io.of('/chatRoom');
var nsp_Tetris = io.of('/Tetris');
const PORT = 8080;  // spring과 중복되는 경우 변경 필요
var sideBar_left = fs.readFileSync('./views/sideBar.ejs','utf8');
var screen = "";

conn.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

nsp_chatRoom.on('connection', function(socket){
  // 접속한 user 정보 수신
  socket.on('login', function(data){
    console.log("Client logged-in:\n name:" + data.userName + "\n userCode: " + data.userCode);
    
    // socket에 user 정보 저장
    socket.userName = data.userName;
    socket.userCode = data.userCode;

    // 접속된 모든 user에게 메세지 전송
    nsp_chatRoom.emit('login', data.userName);
  });

  // user 메세지 수신
  socket.on('chat', function(data){
    console.log('Message from %s: %s', socket.userName, data.msg);

    var msg = {
      from:{
        userName: socket.userName,
        userCode: socket.userCode // 8자리
      },
      msg: data.msg
    };

    // 메세지를 전송한 user를 제외한 모든 user에게 메세지 전송
    // socket.broadcast.emit('chat', msg);

    // 메시지를 전송한 user에게만 메시지를 전송
    // socket.emit('s2c chat', msg);

    // 접속된 모든 user에게 메시지를 전송한다
    nsp_chatRoom.emit('s2c chat', msg);

    // 특정 user에게만 메시지를 전송한다
    // io.to(id).emit('s2c chat', data);
  });

  socket.on('forceDisconnect',function(){
    //nsp.emit('forceDisconnect', socket.userName );
    socket.disConnect();
  });

  socket.on('disconnect', function(){
    nsp_chatRoom.emit('s2c disconnect', socket.userName );
    console.log('user disconnected: ' + socket.userName);
  });
});

app.get('/saveData_Tetris',function(req,res){
  var name = req.query.name;
  var score = req.query.score;
  console.log(name,score);

  //conn.connect();
  var sql = "INSERT INTO tetris (name_tetris,score_tetris) values ('"+ name + "'," + score +")";
  conn.query(sql, function (err, result) {
    if (err){ console.log(err); }
  });
  //conn.end();
  res.redirect('/');
  res.end();
});

app.get('/saveData_SnakeGame',function(req,res){
  var name = req.query.name;
  var score = req.query.score;
  console.log(name,score);

  var sql = "INSERT INTO snakegame (name_snakegame,score_snakegame) values ('"+ name + "'," + score +")";
  conn.query(sql, function (err, result) {
    if (err){ console.log(err); }
  });
  //conn.end();
  res.redirect('/');
  res.end();
});

app.get('/saveData_NumberPuzzle',function(req,res){
  var name = req.query.name;
  var score = req.query.score;
  console.log(name,score);

  var sql = "INSERT INTO numberpuzzle (name_numberpuzzle,score_numberpuzzle) values ('"+ name + "'," + score +")";
  conn.query(sql, function (err, result) {
    if (err){ console.log(err); }
  });
  //conn.end();
  res.redirect('/');
  res.end();
});

app.get('/',function(req,res){    // main page
  var main = fs.readFileSync('./views/main.ejs','utf8');

  screen = ejs.render(sideBar_left) + ejs.render(main);
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write(screen,'utf8');
  res.end();
});
app.get('/NumberPuzzle',function(req,res){
  var np = fs.readFileSync('./games/NumberPuzzle/sliding_NumberPuzzle.ejs','utf8');
  
  screen = ejs.render(sideBar_left) + ejs.render(np);
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write(screen,'utf8');
  res.end();
});

app.get('/SnakeGame',function(req,res){
  var sg = fs.readFileSync('./games/SnakeGame/SnakeGame.ejs','utf8');
  
  screen = ejs.render(sideBar_left) + ejs.render(sg);
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write(screen,'utf8');
  res.end();
});

nsp_Tetris.on('connection', function(socket){
  // 접속한 user 정보 수신
  socket.on('login', function(data){
    console.log("Client logged-in:\n userCode: " + data.userCode);
    
    // socket에 user 정보 저장
    socket.userCode = data.userCode;
  });

  socket.on('dual_player_login', function(){
    console.log("Dual Play Start\n userCode: " + socket.userCode);
    socket.broadcast.emit('dual_player_login',{});
  });

  socket.on('dual_player_data', function(data){
    //console.log('Data from %s', socket.userCode);
    //console.log(data);

    var game_data = {
      from:{
        userCode: socket.userCode // 8자리
      },
      other_user_screen: data.screen,
      other_user_block_x: data.block_x,
      other_user_block_y: data.block_y
    };

    // data 전송한 클라이언트 이외의 클라이언트들에게 받은 data 전송
    socket.broadcast.emit('dual_player_data', game_data);
  });

  socket.on('forceDisconnect',function(){
    socket.disConnect();
  });
  socket.on('disconnect', function(){
    nsp_Tetris.emit('s2c disconnect', {});
    console.log('user disconnected: ' + socket.userCode);
  });
});

app.get('/Tetris',function(req,res){
  var tr = fs.readFileSync('./games/Tetris/Tetris_final.ejs','utf8');
  
  screen = ejs.render(sideBar_left) + ejs.render(tr);
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write(screen,'utf8');
  res.end();
});
app.get('/MineSearch',function(req,res){
  let difficulty = req.query.dif;
  if(difficulty == 'easy'){
    var ms_easy = fs.readFileSync('./games/MineSearch/mine_easy.ejs','utf8');

    screen = ejs.render(sideBar_left) + ejs.render(ms_easy);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.write(screen,'utf8');
    res.end();
  }
  else if(difficulty == 'normal'){
    var ms_normal = fs.readFileSync('./games/MineSearch/mine_normal.ejs','utf8');

    screen = ejs.render(sideBar_left) + ejs.render(ms_normal);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.write(screen,'utf8');
    res.end();
  }
  else if(difficulty == 'hard'){
    var ms_hard = fs.readFileSync('./games/MineSearch/mine_hard.ejs','utf8');

    screen = ejs.render(sideBar_left) + ejs.render(ms_hard);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.write(screen,'utf8');
    res.end();
  }
  else{
    var ms_main = fs.readFileSync('./games/MineSearch/mine_main.ejs','utf8');

    screen = ejs.render(sideBar_left) + ejs.render(ms_main);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.write(screen,'utf8');
    res.end();
  }
});

app.get('/rank', function(req, res) {
  // way 1
  // let sql1 ="SELECT * FROM numberpuzzle ORDER BY score_numberpuzzle ASC LIMIT 5; ";
  // let sql2 = "SELECT * FROM snakegame ORDER BY score_snakegame DESC LIMIT 5; ";
  // let sql3 = "SELECT * FROM tetris ORDER BY score_tetris DESC LIMIT 5;";
  // const multiple_sql = sql1 + sql2 + sql3;

  // conn.query(multiple_sql, function (err, result) {
  //   if (err){ console.log(err); }
  //   console.log(result);
  //   let name_all = [];
  //   let score_all = [];

  //   {
  //     for(var i=0; i<5; i++){
  //       name_all.push(result[0][i].name_numberpuzzle);
  //       score_all.push(result[0][i].score_numberpuzzle);
  //     }
  //     for(var i=0; i<5; i++){
  //       //console.log(result[1][i]);
  //       name_all.push(result[1][i].name_snakegame);
  //       score_all.push(result[1][i].score_snakegame);
  //     }
  //     for(var i=0; i<5; i++){
  //       //console.log(result[2][i]);
  //       name_all.push(result[2][i].name_tetris);
  //       score_all.push(result[2][i].score_tetris);
  //     }
  //   }

    // way 2
    let sql = `SELECT n.name_numberpuzzle AS temp_name, n.score_numberpuzzle AS temp_score FROM (
        SELECT * FROM numberpuzzle AS n ORDER BY n.score_numberpuzzle ASC LIMIT 5
      ) AS n
      UNION ALL
      SELECT s.name_snakegame AS temp_name, s.score_snakegame AS temp_score FROM (
        SELECT * FROM snakegame AS s ORDER BY s.score_snakegame DESC LIMIT 5
      ) AS s
      UNION ALL
      SELECT t.name_tetris AS temp_name, t.score_tetris AS temp_score FROM (
        SELECT * FROM tetris AS t ORDER BY t.score_tetris DESC LIMIT 5
      ) AS t`;
    
    conn.query(sql, function (err, result) {
    if (err){ console.log(err); }
    console.log(result);
    let name_all = [];
    let score_all = [];

    {
      for(var i=0; i < 15; i++){
        name_all.push(result[i].temp_name);
        score_all.push(result[i].temp_score);
      }
    }
    
    console.log(name_all,score_all);
    res.render('rank.ejs', { name : name_all, score : score_all } );
    //res.writeHead(200);
    //{ 'Content-Type': 'application/json' }
    //res.write(JSON.stringify(html));
    res.end();
  });
});

// here ↓
app.get('/chatRoom_db',function(req,res){
  var db_chat = fs.readFileSync('./views/chatRoom_db.ejs','utf8');

    screen = ejs.render(sideBar_left) + ejs.render(db_chat);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.write(screen,'utf8');
    res.end();
});
app.post('/chat_save', (req,res) => {
  //console.log(req.headers);
  var user = req.body.chat_name;
  var user_txt = req.body.chat_txt;
  console.log(user,user_txt);

  var sql = "INSERT INTO chat (user_name,inner_text) values ('"+ user + "','" + user_txt +"')";
  //console.log(sql);
  conn.query(sql, function (err, result) {
    if (err){ console.log(err); }
  });
  res.end();
});
app.post('/conn_chat', (req,res)=>{
  //console.log(req.body.test_txt);
  var sql = "SELECT user_name,inner_text FROM chat ORDER BY index_chat ASC";
  conn.query(sql, function(err,result){
    if (err){ console.log(err); }
    res.send(result);
  });
});

app.get('/chatRoom', function(req,res){
  var socket_chat = fs.readFileSync('./views/chatRoom_socket.ejs','utf8');

  screen = ejs.render(sideBar_left) + ejs.render(socket_chat);
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write(screen,'utf8');
  res.end();
});
//app.listen(PORT);
server.listen(PORT);