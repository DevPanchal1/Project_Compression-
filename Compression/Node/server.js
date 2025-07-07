const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
// Use process.env.PORT for deployment, fallback to 5000 for local development
const port = process.env.PORT || 5000; 

app.use(cors({
  origin: '*', // Be more specific in production if possible (e.g., your frontend URL)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// bodyParser.json() is typically for JSON request bodies.
// For file uploads with multer, req.body will contain non-file fields parsed by multer.
// Keep if you have other JSON endpoints, otherwise it might not be strictly necessary for this app.
app.use(bodyParser.json());

// Serve static files from the React app's build directory
// IMPORTANT: Ensure your React 'build' folder is copied into the 'Node' directory before deployment.
app.use(express.static(path.join(__dirname, 'build')));

// Serve files from PyScript/output for download
app.use("/download", express.static(path.join(__dirname, "PyScript/output")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const inputDir = path.join(__dirname, './PyScript/input');
    // Ensure the input directory exists. It needs to be created on each deploy/start on ephemeral filesystems.
    if (!fs.existsSync(inputDir)) {
      fs.mkdirSync(inputDir, { recursive: true });
    }
    cb(null, inputDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

// POST /upload → auto compress or decompress based on file extension
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const inputPath = path.join(__dirname, "PyScript", "input", req.file.originalname);
  const ext = path.extname(req.file.originalname).toLowerCase();
  const baseName = path.basename(req.file.originalname, ext);

  let command;
  let outputFilename;
  let outputPath;

  if (ext === ".txt") {
    // Compress
    command = "compress";
    outputFilename = baseName + ".bin";
  } else if (ext === ".bin") {
    // Decompress
    command = "decompress";
    outputFilename = baseName + "_decompressed.txt";
  } else {
    return res.status(400).json({ message: "Unsupported file type. Use .txt or .bin." });
  }

  outputPath = path.join(__dirname, "PyScript", "output", outputFilename);

  // Ensure the output directory exists. It needs to be created on each deploy/start.
  const outputDir = path.join(__dirname, './PyScript/output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Received file: ${req.file.originalname}`);
  console.log(`${command === "compress" ? "Compressing" : "Decompressing"} to: ${outputFilename}`);

  // Run Python script
  // Note: 'python' command must be available in the Render environment.
  // Render's default environment usually includes Python.
  const python = spawn("python", ["PyScript/main.py", command, inputPath, outputPath]);

  let pythonStdout = '';
  let pythonStderr = '';

  python.stdout.on("data", (data) => {
    pythonStdout += data.toString();
    console.log(`Python stdout: ${data}`);
  });

  python.stderr.on("data", (data) => {
    pythonStderr += data.toString();
    console.error(`Python stderr: ${data}`);
  });

  python.on("close", (code) => {
    // Clean up the input file after processing, regardless of success or failure
    fs.unlink(inputPath, (err) => {
        if (err) console.error(`Error deleting input file ${inputPath}:`, err);
    });

    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      return res.status(500).json({ 
        message: `${command}ion failed.`,
        details: pythonStderr || `Python process exited with code ${code}` // Provide stderr if available
      });
    }

    // Check if the output file was actually created by the Python script
    fs.access(outputPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Output file not found after Python script: ${outputPath}`, err);
        return res.status(500).json({ 
          message: `${command}ed file not found.`,
          details: `Python output: ${pythonStderr || pythonStdout}` // Show any python output
        });
      }

      // Construct the download URL using the deployed host
      // req.protocol + '://' + req.get('host') will give the full URL (e.g., https://your-service.onrender.com)
      const downloadUrl = `${req.protocol}://${req.get('host')}/download/${outputFilename}`;

      return res.status(200).json({
        success: true,
        command: command, // 'compress' or 'decompress'
        filename: outputFilename,
        downloadUrl: downloadUrl
      });
    });
  });

  python.on('error', (err) => {
    console.error('Failed to start Python process:', err);
    // Clean up the input file if Python process failed to start
    fs.unlink(inputPath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting input file ${inputPath} after spawn error:`, unlinkErr);
    });
    return res.status(500).json({
      message: `Failed to start Python process. Is Python installed and in PATH?`,
      details: err.message
    });
  });
});

// For any other GET request, serve the React app's index.html
// This is crucial for client-side routing in SPAs like React.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error serving React application.');
    }
  });
});

// Server start
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
