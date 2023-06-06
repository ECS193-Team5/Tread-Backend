<!-----

Yay, no errors, warnings, or alerts!

Conversion time: 0.395 seconds.


Using this Markdown file:

1. Paste this output into your source file.
2. See the notes and action items below regarding this conversion run.
3. Check the rendered output (headings, lists, code blocks, tables) for proper
   formatting and use a linkchecker before you publish this page.

Conversion notes:

* Docs to Markdown version 1.0β34
* Mon Jun 05 2023 21:47:53 GMT-0700 (PDT)
* Source doc: Tread Developer Guide
* This is a partial selection. Check to make sure intra-doc links work.
* Tables are currently converted to HTML tables.
----->



# Backend


## Requirements

[npm package manager](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

[mongoDB connection string](https://www.mongodb.com/basics/mongodb-connection-string)

[Firebase service account key](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments)

[Cloudinary account and API keys](https://support.cloudinary.com/hc/en-us/articles/202520942-How-do-I-create-a-new-API-key-and-API-secret-or-remove-an-old-key-)


## Installation


```
git clone https://github.com/ECS193-Team5/Tread-Backend.git
```


Navigate to the project folder and install the required dependencies;


```
npm install
```



## Testing


### Integration


```
npm run integration_test
npm run integration_test_coverage
```



### Unit


```
npm run unit_test
npm run unit_test_coverage
```



## Technologies

The backend server is a Node.js Express server which contains most of the business logic of the application. 



1. Mongoose - This is the API used to write and update data in the MongoDB cluster.
2. Express-session + connect-mongo - This is used to store user session information in the MongoDB cluster and in the server.
3. FirebaseSDK - This is used for sending push notifications to devices through Firebase Cloud Messaging.
4. Cloudinary - This is used for storing, uploading, deleting user photos while being able to serve them quickly.


## Organization

**Index.js:** This starts the express server initializes the required services (Mongoose, firebase, Cloudinary).

**/routes:** This folder contains the routes of the server and their related functions.

**/models:** This folder contains the schemas and models used in the routes to update database collections.
