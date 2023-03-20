var mysql = require("mysql");
var http = require("http");
var conn = mysql.createConnection({
    host: '127.0.0.1',
        port: '3306',
        user: 'root',
        password: 'root*9638527410',
        database: 'testdb'
});

conn.connect();
var sql = "SELECT * from numberpuzzle";
var html;
conn.query(sql, function (err, rows, fields) {
    if (err) console.log(err);
    console.log(rows); //rows is Array
    html = rows;
});
conn.end();
var app = http.createServer(function(req,res){
    res.writeHead(200,{ 'Content-Type': 'application/json' });
    res.write(JSON.stringify(html));    // Uint8Array로 변경해야 오류가 생기지 않는다
    res.end();
});
app.listen(8080);

