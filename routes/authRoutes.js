const path = require('path');
const os = require('os');
const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');
const Multer = require('multer');
const request = require('request');
const { getLinkPreview } = require('link-preview-js');

const {Translate} = require('@google-cloud/translate').v2;
const {Storage} = require('@google-cloud/storage');

const db = require('../config/database');
const { json } = require('express');

const router = express.Router();

const storage = new Storage();
const translate = new Translate();

// Multer is required to process file uploads and make them available via
// req.files.
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

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
    jwt.verify(bearerToken, process.env.JWT_SECRET_KEY, function(err, decoded) {
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
        db.get(userSql, decoded.userid, (err, row) => {
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
  Uploads a file in a form to the google cloud bucket
*/
router.post('/upload', multer.single('file'), (req, res, next) => {
  // A bucket is a container for objects (files).
  const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

  if (!req.file) {
    res.status(400).json({error: 'No file uploaded.'});
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', (err) => {
    console.log(err);
    res.json(err);
  });

  blobStream.on('finish', () => {
    res.status(200).json({ identifier: blob.name });
  });

  blobStream.end(req.file.buffer);
});

/* Endpoint to download a file.
  Takes in file's identifier parameter and
  downloads the file
*/
router.get('/download/:identifier', async (req, res) => {
  const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
  const srcFilename = req.params.identifier;
  const destFilename = path.join(os.homedir(), srcFilename);

  const options = {
    // The path to which the file should be downloaded
    destination: destFilename,
  };

  // Download the file to the server
  await storage.bucket(bucketName).file(srcFilename).download(options);

  // Send the file over to the client
  await res.download(destFilename);

  // Delete the file downloaded to the server
  fs.unlink(destFilename, function (err) {
    // catch error and log it to console for debugging purposes
    if (err) {
      console.error(err);
    }

    // if no error, file has been deleted successfully
    console.log('File deleted!');
  });

  // Write a response to user
  res.json({
    msg: "File downloaded successfully"
  });
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