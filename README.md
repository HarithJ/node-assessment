# node-assessment
This is an assessment for an EdTech company

# How To Run The Application
## Dependencies
The application is built using Node.js and it's packages are managed using NPM package manager. To install the dependecies run:
`npm install`

The application also depends on Google Cloud Translate service and Google Storage Service, therefore you will need a Google Cloud Platform account which has Google Cloud Translate API enabled (for more information on this check out this [link](https://cloud.google.com/translate/docs/setup)) and a [bucket](https://cloud.google.com/storage/docs/creating-buckets).

## Environment Variables
The application depends on three main environment variables:
```
JWT_SECRET_KEY=[PUT IN YOUR VALUE]
TOKEN_EXPIRES_IN=[PUT IN YOUR VALUE]
GCLOUD_STORAGE_BUCKET=[PUT IN YOUR VALUE]
```
`JWT_SECRET_KEY` is used to encrypt JWT token.
`TOKEN_EXPIRES_IN` defines the time period after which the JWT token will expire
`GCLOUD_STORAGE_BUCKET` is the name of the Google Cloud Storage Bucket which will be used to upload file by the application.

You should place these environment variables in a `.env` file which should be placed in the parent folder.

## Start The Application
In order to run the application for development purpose, execute the below command:
`npm run start:dev`

TO run the application for production, execute the below command:
`npm start`

# Endpoints
The application exposes 7 endpoints:

`/`: This is the index route. It just displays a welcome message.

`/login/:username/:password`: This route is used to login. It needs two parameters: username, and password. After a successfull login, this route will return a JWT token which will be used to access other protected routes.

`/api/users`: Returns a list of users with their passwords. At the time of writing, I have just created one user. This app is for test purposes and so the user will be used to login to the application.

`/upload`: Used to upload a file to the GCP bucket. This is a POST request and needs a "Multipart Form" which contains a `file` field with a actual file as its value. This route returns file's identifier so that it can be later used to download the file.

`/download/:identifier`: Downloads a file from the GCP bucket using `:identifier` parameter to identify the file.

`/parse/:url`: It takes in `:url` parameter and returns back site preview data in JSON format.

`/translate/:url`: It takes in `:url` as a parameter and returns back it's HTML page in Russian language.
