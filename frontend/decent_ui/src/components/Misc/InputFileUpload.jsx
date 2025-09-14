import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Hidden input styled for accessibility: visually hidden but operable via label.
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

/**
 * InputFileUpload
 * https://medium.com/@blessingmba3/building-a-file-uploader-with-react-11dba6409480
 * 
 * Reusable file upload button component.
 * - Wraps a hidden <input type="file"> inside an MUI button.
 * - Shows upload icon and label
 * 
 * Props: 
 * - onChange: callback when files are selected
 * - accept: string of accepted MIME types 
 * - multiple: boolean, allow multiple file selections - false
 */

export default function InputFileUpload({ onChange = () => {}, accept = 'image/*', multiple = false }) {
    return (
        <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 1.25 }, width: { xs: '100%', sm: 'auto' } }}
        >
            Upload file
            <VisuallyHiddenInput
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={onChange}
            />
        </Button>
    );
}