const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const request = require('request');
const { getLinkPreview } = require('link-preview-js');
const {Translate} = require('@google-cloud/translate').v2;

const db = require('../config/database');
const { json } = require('express');

const router = express.Router();
const translate = new Translate();

/* Authentication middleware */
function authmd (req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    jwt.verify(bearerToken, 'my_secret_key', function(err, decoded) {
      if (err) {
        res.json({err});
      }
      else {
        const userSql = 'select * from user where id = ?'
        db.get(userSql, decoded, (err, row) => {
          req.user = row.username
          next();
        });
      }
    });
  }
  else {
    res.json({msg: 'Unauthorized'});
  }
}

router.use(authmd);

router.get('/parse/:url', (req, res, next) => {
  url = decodeURIComponent(req.params.url);
  getLinkPreview(url)
  .then((data) => {
    res.json(data);
  })
  .catch((err) => {
    res.json(err);
  });
});

router.post('/upload', (req, res, next) => {
  const form = formidable({ 
    multiples: false,
    uploadDir: __dirname + '/../uploads',
    keepExtensions: true
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.json({ err });
      return;
    }
    identifier = path.basename(files.file.path);
    res.json({ identifier });
  });
});

router.get('/download/:identifier', function(req, res){
  const file = `${__dirname}/../uploads/${req.params.identifier}`;
  res.download(file);
});

router.get('/translate/:url', (req, res) => {
  url = decodeURIComponent(req.params.url);
  request(url, async function (error, response, body) {
    let translation = await translate.translate(body, 'ru');
    res.send(translation[0]);
  });
});

module.exports = router;