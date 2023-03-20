const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { getDatabase } = require("firebase-admin/database");

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

const express = require("express");
const app = express();

app.get("/screams", (req, res) => {
  admin
    .firestore()
    .collection("screams")
    .get()
    .then((data) => {
      let screens = [];
      data.forEach((doc) => {
        screens.push(doc.data());
      });

      return res.json(screens);
    })
    .catch((err) => console.error(err));
});

exports.createScream = functions.https.onRequest((req, res) => {
  const response = req.body;

  console.log(response)

  admin
    .firestore()
    .collection("screams")
    .add({
      ...response,
      createdAt: admin?.firestore?.Timestamp?.fromDate(new Date()),
    })
    .then((data) => {
      res.json({
        message: `document ${data.id} created successfully`,
        ...data,
      });
    })
    .catch((err) => {
      res.status(500).json("Something went wrong");
      console.error(err);
    });

});

exports.api = functions.https.onRequest(app);
