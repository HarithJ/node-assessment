const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./db/harith.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    else {
        console.log('Connected to the harith database.');
        db.run(`CREATE TABLE user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username text,
        password text
        )`,
        (err) => {
        if (err) {
            console.log('Table exists!');
        }
        else {
            // create dummy data
            var insert = 'INSERT INTO user (username, password) VALUES (?,?)';
            db.run(insert, ["harith","abcd1234"]);
        }
        });
    }
  });

  module.exports = db;