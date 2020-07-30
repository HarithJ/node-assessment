const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../config/database');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({'welcome': 'Hello World'});
});

/* GET login endpoint.
  Takes in two parameters:
    1. username: user's username used to login
    2. password: user's passowrd used to login
  
  Returns a JWT token if the user was able to login successfully.
  Returns "Not authorized" error if the user failed to login.
*/
router.get('/login/:username/:password', (req, res, next) => {
  // create SQL statement
  const userSql = 'select * from user where username = ?'

  // get user from the db using username parameter
  db.get(userSql, req.params.username, (err, row) => {
    // if there was an error, send the error message 
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }

    // if the user was found and the password is correct
    // return the token
    if (row && row.password === req.params.password) {
      const token = jwt.sign({ userid: row.id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.TOKEN_EXPIRES_IN });
      res.json({ token });
      return;
    }

    // else the user was not found or the password was incorrect
    else {
      res.status(401).json({"error": 'Not authorized'});
      return;
    }
  })
});

module.exports = router;
