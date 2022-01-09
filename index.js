const express = require("express");
const app = express();
const port = 3001;
require("dotenv").config();
const nodemailer = require("nodemailer");

app.listen(port, () => {
  console.log(`nodemailerProject is listening at http://localhost:${port}`);
});

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
  to: "vuyani@innovativethinking.co.za",
  subject: "Node script",
  text: "Hi, What's the progress?",
};

transporter.sendMail(mailOptions, function (err, data) {
  if (err) {
    console.log("Error " + err);
  } else {
    console.log("Email sent successfully " + data.response);
  }
});
