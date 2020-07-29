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

/* Authentication middleware.
  Used to get JWT token from the headers and validate it.
*/
function authmd (req, res, next) {
  // get authorization header which should be in the format of:
  // Bearer [token]
  const bearerHeader = req.headers['authorization'];

  // if authorization header exists
  if (bearerHeader) {
    // split it and get the token
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];

    // verify the token
    jwt.verify(bearerToken, 'my_secret_key', function(err, decoded) {
      // catch errors
      if (err) {
        res.json({err});
      }

      // no errors occured and user's id was gotten successfully from the token
      // use the id to fetch user from db
      // and store the user in request so it can be available to functions
      // after the middleware
      else {
        const userSql = 'select * from user where id = ?'
        db.get(userSql, decoded, (err, row) => {
          req.user = row.username
          next();
        });
      }
    });
  }

  // token does not exists in header, send not authorized error
  else {
    res.status(401).json({ "error": 'Not authorized' });
  }
}

/* Use authentication middleware
  before calling any route in this file
*/
router.use(authmd);

/* Endpoint that takes in encoded url as a parameter
  and returns website preview data
*/
router.get('/parse/:url', async (req, res, next) => {
  // decode url parameter
  url = decodeURIComponent(req.params.url);
  
  // get link's preview data
  let data, err = await getLinkPreview(url);

  // catch errors if any
  if (err) {
    res.json(err);
  }

  // send link's preview data as json
  res.json(data);
});

/* Endpoint to upload a file.
  Uploads all files in a form to the uploads folder
*/
router.post('/upload', (req, res, next) => {
  // configure formidable to upload files
  const form = formidable({ 
    multiples: true,
    uploadDir: __dirname + '/../uploads',
    keepExtensions: true
  });

  // parse the form
  form.parse(req, (err, files) => {
    // catch errors if any
    if (err) {
      res.json({ err });
      return;
    }

    // get the file's identifier and return it
    // so it can be used to download the file
    identifier = path.basename(files.file.path);
    res.json({ identifier });
  });
});

/* Endpoint to download a file.
  Takes in file's identifier parameter and
  downloads the file
*/
router.get('/download/:identifier', function(req, res){
  const file = `${__dirname}/../uploads/${req.params.identifier}`;
  res.download(file);
});

/* Endpoint that takes in encoded url and sends translated HTML
*/
router.get('/translate/:url', async (req, res) => {
  // decode url
  url = decodeURIComponent(req.params.url);

  // extract html from the url using "request" module
  request(url, async function (err, response, body) {
    // catch errors
    if (err) {
      res.json({ err });
    }

    // translate the html body and send the translated html as response 
    let translation = await translate.translate(body, 'ru');
    res.send(translation[0]);
  });
});

module.exports = router;