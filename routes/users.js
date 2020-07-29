const express = require('express');
const router = express.Router();

const db = require('../config/database');

/* GET users listing. */
router.get("/api/users", (req, res, next) => {
  // create SQL statement to select all users
  var sql = "select * from user"

  // run db query to get all users
  db.all(sql, (err, rows) => {
    // catch errors
    if (err) {
      res.status(400).json({"error":err.message});
      return;
    }

    // if no errors occured, return all the rows fetched from the db
    res.json({
        "message": "success",
        "data": rows
    })
  });
});

module.exports = router;
