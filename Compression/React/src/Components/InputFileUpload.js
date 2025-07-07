import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { indigo } from "@mui/material/colors";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CircularProgress } from "@mui/material"; // Added CircularProgress

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const UploadButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(indigo[300]),
  backgroundColor: indigo[500],
  "&:hover": {
    backgroundColor: indigo[400],
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(indigo[300]),
  backgroundColor: indigo[500],
  "&:hover": {
    backgroundColor: indigo[400],
  },
}));

const RemoveButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(indigo[300]),
  backgroundColor: "#e53935",
  "&:hover": {
    backgroundColor: "#d32f2f",
  },
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  marginTop: "1rem",
  color: theme.palette.getContrastText(indigo[300]),
  backgroundColor: "#43a047", // green
  "&:hover": {
    backgroundColor: "#388e3c",
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  marginTop: "1rem",
  color: theme.palette.getContrastText(indigo[300]),
  backgroundColor: indigo[600],
  "&:hover": {
    backgroundColor: indigo[700],
  },
}));

export default function InputFileUpload() {
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [downloadUrl, setDownloadUrl] = React.useState("");
  const [commandType, setCommandType] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [compressionPercentage, setCompressionPercentage] =
    React.useState(null); // New state for percentage

  const ref = React.useRef();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const file = ref.current.files[0];
    if (!file) {
      setErrorMessage("No file selected. Please choose a file to upload.");
      setLoading(false);
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/upload", {
        // Use relative path for deployment
        method: "POST",
        body: form,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMessage(result.message || "Something went wrong.");
        setLoading(false);
        return;
      }

      setUploadSuccess(true);
      setSelectedFile(file.name);
      setDownloadUrl(result.downloadUrl);
      setCommandType(result.command);
      setCompressionPercentage(result.compressionPercentage); // Store the percentage
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage(
        error.message || "Error uploading file. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUploadSuccess(false);
    setErrorMessage("");
    setSelectedFile(null);
    setDownloadUrl("");
    setCommandType("");
    setLoading(false);
    setCompressionPercentage(null); // Reset percentage
    if (ref.current) {
      ref.current.value = null;
    }
  };

  const handleFileChange = () => {
    setErrorMessage("");
    const file = ref.current.files[0];

    if (!file) {
      setSelectedFile(null);
      setErrorMessage("No file selected.");
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "bin"].includes(ext)) {
      setErrorMessage(
        "Unsupported file type. Please upload .txt or .bin files."
      );
      setSelectedFile(null);
      if (ref.current) ref.current.value = null;
      return;
    }

    const size = file.size;
    const maxSize = 3 * 1024 * 1024;
    if (size > maxSize) {
      setErrorMessage(`File size exceeds ${maxSize / (1024 * 1024)}MB limit.`);
      setSelectedFile(null);
      if (ref.current) ref.current.value = null;
      return;
    }

    setSelectedFile(file.name);
  };

  return (
    <div className="upload">
      {!uploadSuccess && (
        <>
          <Typography variant="h6" gutterBottom>
            Upload a `.txt` file to compress (max 3MB) or a `.bin` file to
            decompress.
          </Typography>
          {errorMessage && (
            <Typography variant="h6" color="error">
              {errorMessage}
            </Typography>
          )}

          <form onSubmit={onSubmit}>
            <div
              className="flex"
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <UploadButton
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                Choose file
                <VisuallyHiddenInput
                  ref={ref}
                  type="file"
                  accept=".txt,.bin"
                  onChange={handleFileChange}
                />
              </UploadButton>

              {selectedFile && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <Typography variant="body1">{selectedFile}</Typography>
                  <RemoveButton
                    onClick={handleReset}
                    variant="contained"
                    disabled={loading}
                  >
                    Remove
                  </RemoveButton>
                </div>
              )}

              <SubmitButton
                type="submit"
                variant="contained"
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Submit File"
                )}
              </SubmitButton>
            </div>
          </form>
        </>
      )}

      {uploadSuccess && downloadUrl && (
        <>
          <Typography variant="h6" gutterBottom>
            File processed successfully!
          </Typography>
          {commandType === "compress" && compressionPercentage !== null && (
            <Typography variant="body1" gutterBottom>
              Compressed by: <strong>{compressionPercentage}%</strong>
            </Typography>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <DownloadButton variant="contained" href={downloadUrl} download>
              Download{" "}
              {commandType === "compress" ? "Compressed" : "Decompressed"} File
            </DownloadButton>
            <BackButton
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={handleReset}
            >
              Process Another File
            </BackButton>
          </div>
        </>
      )}
    </div>
  );
}
