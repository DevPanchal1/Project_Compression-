const express= require( "express");
const body= require("body-parser");
const multer = require("multer");
const cors = require("cors");
const app = express();
const port = 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

const storage = "./PyScripts/input"; 
const upload = multer({ storage: storage });


app.use(body.json());

app.post("/upload", upload.single("file"), (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.json("Congo Dude!");
});


app.listen(port, () => {
  console.log("Server listening on port", port);
});
