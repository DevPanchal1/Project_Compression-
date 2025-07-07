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

/**
 * Helper function to get file size.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<number>} A promise that resolves with the file size in bytes.
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch (error) {
    // If file not found or other error, return 0 or re-throw if critical
    console.error(`Error getting file size for ${filePath}:`, error);
    return 0; 
  }
}

/**
 * Helper function to run the Python script.
 * @param {string} command - 'compress' or 'decompress'
 * @param {string} inputPath - Path to the input file for Python.
 * @param {string} outputPath - Path for the output file from Python.
 * @returns {Promise<void>} A promise that resolves if Python script succeeds, rejects otherwise.
 */
function runPythonScript(command, inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonArgs = ["PyScript/main.py", command, inputPath, outputPath];
    console.log(`Running Python: python ${pythonArgs.join(' ')}`);

    const python = spawn("python", pythonArgs);

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on("data", (data) => {
      stdoutData += data.toString();
      // console.log(`Python stdout: ${data}`); // Uncomment for verbose Python stdout in logs
    });

    python.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        // Reject with a more informative error message
        reject(new Error(`Python ${command}ion failed. Details: ${stderrData || stdoutData || 'Unknown Python error'}`));
      } else {
        console.log(`Python ${command}ion successful.`);
        resolve();
      }
    });

    python.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      // Reject if the Python process itself couldn't be spawned (e.g., 'python' not found)
      reject(new Error(`Failed to start Python process: ${err.message}. Is Python installed and in PATH?`));
    });
  });
}

// POST /upload → auto compress or decompress based on file extension
app.post("/upload", upload.single("file"), async (req, res) => { // Make the route handler async
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
    command = "compress";
    outputFilename = baseName + ".bin";
  } else if (ext === ".bin") {
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

  try {
    const originalFileSize = await getFileSize(inputPath); // Get original file size

    // AWAIT the Python script to complete
    await runPythonScript(command, inputPath, outputPath);

    // Clean up the input file after processing, regardless of success or failure
    fs.unlink(inputPath, (err) => {
        if (err) console.error(`Error deleting input file ${inputPath}:`, err);
    });

    // After Python script completes, check if the output file was actually created
    await fs.promises.access(outputPath, fs.constants.F_OK);

    const finalOutputFileSize = await getFileSize(outputPath); // Get final output file size

    let compressionPercentage = null; // Default to null
    if (command === "compress" && originalFileSize > 0) {
      compressionPercentage = ((originalFileSize - finalOutputFileSize) / originalFileSize) * 100;
      // Ensure percentage is not negative due to small file size variations or headers
      if (compressionPercentage < 0) compressionPercentage = 0; 
    }

    // Construct the download URL using the deployed host
    const downloadUrl = `${req.protocol}://${req.get('host')}/download/${outputFilename}`;

    return res.status(200).json({
      success: true,
      command: command, // 'compress' or 'decompress'
      filename: outputFilename,
      downloadUrl: downloadUrl,
      compressionPercentage: compressionPercentage !== null ? parseFloat(compressionPercentage.toFixed(2)) : null 
    });

  } catch (error) {
    console.error(`Processing failed: ${error.message}`);
    // Attempt to clean up input file if an error occurred before unlink in .on('close')
    // This is a fallback, as runPythonScript should handle unlink on close.
    if (fs.existsSync(inputPath)) {
      fs.unlink(inputPath, (err) => {
          if (err) console.error(`Error deleting input file ${inputPath} after error in catch block:`, err);
      });
    }
    return res.status(500).json({
      message: `Operation failed: ${error.message}`,
      details: error.message
    });
  }
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
