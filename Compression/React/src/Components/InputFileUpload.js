import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { lime } from '@mui/material/colors';
import Typography from '@mui/material/Typography';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(lime[500]),
  backgroundColor: lime[500],
  '&:hover': {
    backgroundColor: lime[700],
  },
}));

export default function InputFileUpload(props) {
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const ref = React.useRef();

  const onSubmit = async (e) => {
    e.preventDefault();
    const file = ref.current.files[0];

    if (!file) {
      setErrorMessage('No file selected.');
      return;
    }

    if (file.type !== 'text/plain') {
      setErrorMessage('Only .txt files are allowed.');
      return;
    }

    const form = new FormData();
    form.append("file", file);

    console.log("Done with submission");

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        setErrorMessage('Something went wrong');
        return;
      }

      const data = await res.json();
      console.log(data);
      setUploadSuccess(true);

    } catch (e) {
      console.log("Error", e);
      setErrorMessage('Error uploading file');
    }
  }

  const handleReset = () => {
    setUploadSuccess(false);
    setErrorMessage('');
    ref.current.value = null; // Clear the file input
  }

  return (
    <div className="upload">
      <Typography variant="h5">Upload .txt File</Typography>
      {errorMessage && <Typography color="error">{errorMessage}</Typography>}
      <form onSubmit={onSubmit}>
        <UploadButton
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={uploadSuccess}
        >
          {uploadSuccess ? 'Uploaded!' : 'Upload file'}
          <VisuallyHiddenInput
            ref={ref}
            type="file"
            accept=".txt"
            onChange={() => setErrorMessage('')} // Clear error message on file change
          />
        </UploadButton>
        {uploadSuccess && (
          <Button variant="contained" onClick={handleReset}>
            Upload Another File
          </Button>
        )}
      </form>
    </div>
  );
}
