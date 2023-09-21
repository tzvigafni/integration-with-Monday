const dbConfig = require("./dbConfig");
const mysql = require("mysql2");

const connection = mysql.createConnection(dbConfig);

try {
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to the database: ", err);
    } else {
      console.log("DB Connected!");
    }
  });
} catch (error) {
  console.error("Error connecting to the database- ", error);
}

module.exports = connection;
