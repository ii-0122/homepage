const maria = require('mysql');

var connection = maria.createConnection({   // 배포에 mariadb 사용
    host: 'mariadb-01', // '127.0.0.1' localhost
    port: '3306', // 3306
    user: 'admin_01',  // testnew
    password: 'ad*6216',  // pass12345
    database: 'testdb', // testdb
    multipleStatements: true
  });

  module.exports = connection;