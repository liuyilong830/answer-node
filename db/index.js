const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  port: '3306',
  database: 'answer',
  socketPath: '/tmp/mysql.sock'
})

connection.connect();

module.exports = connection;