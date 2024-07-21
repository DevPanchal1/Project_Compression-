const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

const upload = multer({
  dest: './PyScript/input',
  filename: file.originalname,
  limits: {
      fileSize: 3000000 // 3mb 
  },
})
app.use(bodyParser.json());


app.post("/upload", upload.single("file"), (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  console.log("File uploaded:", file.originalname);
  res.status(200).json({ message: "File uploaded" });
});

app.listen(port, () => {
  console.log("Server listening on port", port);
});
