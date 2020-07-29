const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../config/database');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({'welcome': 'Hello World'});
});

router.get('/login/:username/:password', (req, res, next) => {
  const userSql = 'select * from user where username = ?'
  db.get(userSql, req.params.username, (err, row) => {
    if (err) {
      res.status(400).json({"error":err.message});
      return;
    }
    if (row) {
      if (row.password === req.params.password) {
        const token = jwt.sign(row.id, 'my_secret_key');
        res.json({token: token});
        return;
      }
      else {
        res.status(400).json({"error": 'Not authorized'});
        return;
      }
    }
    else {
      res.status(400).json({"error": 'Not authorized'});
      return;
    }
  })
});

module.exports = router;
