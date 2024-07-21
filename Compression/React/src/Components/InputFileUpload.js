import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { indigo } from "@mui/material/colors";
import Typography from "@mui/material/Typography";

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
    backgroundColor: indigo[600],
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(indigo[300]),
  backgroundColor: indigo[500],
  "&:hover": {
    backgroundColor: indigo[600],
  },
}));

export default function InputFileUpload(props) {
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState(null);

  const ref = React.useRef();

  const onSubmit = async (e) => {
    e.preventDefault();
    const file = ref.current.files[0];

    if (!file) {
      setErrorMessage("No file selected.");
      return;
    }

    if (file.type !== "text/plain") {
      setErrorMessage("Only .txt files are allowed.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        setErrorMessage("Something went wrong");
        return;
      }

      setUploadSuccess(true);
      setSelectedFile(file.name); // Set the selected file name
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage("Error uploading file. Please try again.");
    }
  };

  const handleReset = () => {
    setUploadSuccess(false);
    setErrorMessage("");
    setSelectedFile(null); // Clear selected file
    ref.current.value = null;
  };

  const handleFileChange = () => {
    setErrorMessage(""); // Clear any previous error message

    const file = ref.current.files[0];

    if (file) {
      setSelectedFile(file.name); // Update selected file name
    } else {
      setSelectedFile(null); // Reset selected file name if no file is selected
    }
  };

  return (
    <div className="upload">
      {!(uploadSuccess) && <Typography variant="h5">Upload .txt File</Typography>}
      {errorMessage && (
        <Typography variant="h5" color="error">
          {errorMessage}
        </Typography>
      )}

      <form onSubmit={onSubmit}>
        <div className="flex">
          <UploadButton
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={uploadSuccess}
          >
            {uploadSuccess ? "Uploaded!" : "Choose file"}
            <VisuallyHiddenInput
              ref={ref}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
            />
          </UploadButton>

          {selectedFile && !(uploadSuccess) && (
            <Typography variant="body1" style={{ marginLeft: "10px" }}>
              {selectedFile}
            </Typography>
          )}

          <SubmitButton
            type="submit"
            variant="contained"
            disabled={uploadSuccess}
          >
            Submit File
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
