import ParticlesComponent from "./particles";
import InputFileUpload from "./InputFileUpload";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

function App() {
  return (
    <>
      <div className="App">
        <ParticlesComponent id="particles" />

        <header className="header">
          <Typography variant="h3" gutterBottom>
            Huffman Text File Compressor
          </Typography>

          <Typography variant="body1" className="description" paragraph>
            This tool compresses plain text files using Huffman Coding, a
            lossless data compression algorithm. It analyzes character
            frequency, builds a binary tree, and encodes text using
            variable-length binary codes — shorter codes for frequent characters
            and longer ones for rare ones.
          </Typography>
        </header>

        <main className="center">
          <Paper elevation={6}  square={false} variant="elevation" className="upload-box">
            <InputFileUpload />
          </Paper>
        </main>
      </div>
    </>
  );
}

export default App;
