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


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./PyScripts/input");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(bodyParser.json());


app.post("/upload", upload.single("file"), (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  console.log("File uploaded:", file.originalname);
  const filePath = path.join(__dirname, "PyScripts", "input", file.originalname);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error processing file");
    }
  
    const processedData = data.toUpperCase(); 
    
    res.json({ result: processedData });
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
  });
});

app.listen(port, () => {
  console.log("Server listening on port", port);
});
