import express from "express";
import { json } from "body-parser";
import multer, { memoryStorage } from "multer"; 
const app = express();
const port = 5000;


const storage = memoryStorage(); 
const upload = multer({ storage: storage });


app.use(json())

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
