const express = require("express");
const app = express();
const port = 3001;

require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment");
app.use(express.json());

app.listen(port, () => {
  console.log(`nodemailerProject is listening at http://localhost:${port}`);
});

const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.post("/send", (req, resp) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });

  let mailOptions = {
    from: "nkunamandla53@gmail.com",
    to: req.body.eRecips,
    subject: req.body.eSubject,
    text: req.body.eText,
  };

  transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log("Error " + err);
    } else {
      console.log("Email sent successfully");
      //   resp.json({ requestBody: req.body });
      write(
        req.body.id,
        "inbox",
        req.body.name,
        req.body.eSubject,
        req.body.eRecips,
        req.body.eText
      )
        .then((res) => {
          write(
            req.body.id,
            "sent",
            req.body.name,
            req.body.eSubject,
            req.body.eRecips,
            req.body.eText
          )
            .then((res) => {
              resp.send("Email sent successfully");
            })
            .catch((err) => throwErr(resp, err.message));
        })
        .catch((err) => throwErr(resp, err.message));
    }
  });
});

async function write(id, col, name, eSubject, eRecips, eText) {
  let docRef;
  if (!id) docRef = db.collection(col).doc();
  else docRef = db.collection(col).doc(id);
  await docRef.set({
    name,
    eSubject,
    eRecips,
    eText,
    dateTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
  });
}

function throwErr(resp, message) {
  resp.status(500).send(message);
  console.log("error occured: ", message);
}

app.get("/", (req, resp) => {
  readAll("inbox")
    .then((res) => {
      if (res) resp.send(res);
      else resp.send("No data");
    })
    .catch((err) => throwErr(resp, err.message));
});

async function readAll(col) {
  const qss = await db.collection(col).get();
  const data = [];
  qss.forEach((doc) => {
    data.push({
      id: doc.id,
      eSubject: doc.get("eSubject"),
      eText: doc.get("eText"),
      eRecips: doc.get("eRecips"),
    });
  });
  return data;
}

app.post("/get", (req, resp) => {
  read("inbox", req.body.id)
    .then((res) => {
      if (res) resp.send(res);
      else resp.send("No data");
    })
    .catch((err) => throwErr(resp, err.message));
});

async function read(col, id) {
  const qss = await db.collection(col).doc(id).get();
  return qss.data();
}

app.post("/delete", (req, resp) => {
  move("inbox", "trash", req.body.id, false)
    .then((res) => {
      resp.send(req.body.id + " moved to trash");
    })
    .catch((err) => throwErr(resp, err.message));
});

async function move(from, to, id, label) {
  const qss = await db.collection(from).doc(id).get();
  const data = qss.data();
  write(id, to, data.name, data.eSubject, data.eRecips, data.eText).then(
    (res) => {
      if (!label) db.collection(from).doc(id).delete();
    }
  );
}

app.post("/recover", (req, resp) => {
  move("trash", "inbox", req.body.id, false)
    .then((res) => {
      resp.send(req.body.id + " moved to inbox");
    })
    .catch((err) => throwErr(resp, err.message));
});

app.get("/trash", (req, resp) => {
  readAll("trash")
    .then((res) => {
      if (res) resp.send(res);
      else resp.send("No data");
    })
    .catch((err) => throwErr(resp, err.message));
});

app.post("/label", (req, resp) => {
  move("inbox", "label", req.body.id, true)
    .then((res) => {
      resp.send(req.body.id + " moved to label");
    })
    .catch((err) => throwErr(resp, err.message));
});

app.post("/unlabel", (req, resp) => {
  unlable(req.body.id);
  resp.send("removed label");
});

function unlable(id) {
  db.collection("label").doc(id).delete();
}

app.get("/labelmails", (req, resp) => {
  readAll("label")
    .then((res) => {
      if (res) resp.send(res);
      else resp.send("No data");
    })
    .catch((err) => throwErr(resp, err.message));
});
