import React, { useState, useMemo } from "react";
import { Box, Button, Tooltip, InputLabel, TextField, ToggleButton } from "@mui/material";
import { DateField } from '@mui/x-date-pickers/DateField';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { SubmitVCButton } from "../Buttons";
import InputFileUpload from '../Misc/InputFileUpload';
import ClearIcon from '@mui/icons-material/Clear';
import dayjs from 'dayjs';
import SnackbarAlert from "../Misc/Snackbar";

/**
 * IdentityForm
 * 
 * Creates a VC payload by collecting a context, description, optionally an avatar,
 * and up to 5 key/value identity attributes (either date or string).
 */
export default function IdentityForm() {
    const [context, setContext] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState([{key: '', value: '', id: crypto.randomUUID(), isDate: false}]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    // Generate a local preview URL for the uploaded avatar.
    const uploadedImageUrl = useMemo(
        () => (avatarFile? URL.createObjectURL(avatarFile) : null),
        [avatarFile]
    );

    // Add a new empty field up to a limit of 5 total.
    const addFormField = () => {
        if (fields.length < 5) {
            setFields(prev => [...prev, {key: '', value: '', id: crypto.randomUUID(), isDate: false }]);
        }
    };

    // Update a specific property of a field by index.
    const handleUpdate = (index, type, value) => {
        setFields(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [type]: value};
            return updated;
        });
    };

    // Remove a field by index.
    const handleDelete = (indexToRemove) => {
        setFields(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Reset the entire form to initial state.
    const resetForm = () => {
        setContext('');
        setDescription('');
        setFields([{key: '', value: '', id: crypto.randomUUID(), isDate: false }]);
        setAvatarFile(null);
    };

    // Assemble the credential payload from current form state.
    const identityCredential = useMemo(() => {
        const subject = fields.reduce((acc, f) => {
            if (f.key.trim()) acc[f.key] = f.value;
            return acc;
        },  {});
        return { 
            context, 
            description,
            subject,
        };
    }, [context, description, fields]);

    return (
        <Box component="form" sx={{ px: 2, mt: 5, mb: 5 }} noValidate autoComplete="off">
            {/* Context + Description */}
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 4, alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <InputLabel sx={{ mb: 1, color:'white', fontSize: '1.5rem', textAlign: 'left' }}>Context</InputLabel>
                        <TextField
                            required
                            fullWidth
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            id="outlined"
                            label="Required"
                            sx={{ width: 500, maxWidth: 500 }}
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={{ mb: 1, color:'white', fontSize: '1.5rem', textAlign: 'left'}}>Description</InputLabel>
                        <TextField
                            multiline
                            rows={3}
                            fullWidth
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            label='Description'
                            variant='outlined'
                            sx={{ width: 500, maxWidth: 500 }}
                        />  
                    </Box>
                </Box>

                {/* Avatar upload + preview */}
                <Box>
                    <InputLabel sx={{ mb: 1, color:'white', fontSize: '1.5rem', textAlign: 'left'}}>Avatar</InputLabel>
                    <Box sx={{ 
                        width: 250, 
                        height: 250, 
                        border: '2px dashed #ccc',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        overflow: 'hidden',
                        bgcolor: '#333'
                        }}
                    >
                        {uploadedImageUrl ? (
                            <img 
                                src={uploadedImageUrl} 
                                alt="Uploaded Content" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                        ) : (
                                <InputLabel sx={{ color: '#ccc' }}>Image Preview</InputLabel>
                            )}
                    </Box>
                    <InputFileUpload 
                        onChange={(e) => {
                            const file = e.target.files?.[0]; 
                            if (file) setAvatarFile(file)
                        }} />
                </Box>
            </Box>

            {/* Dynamic subject fields */}      
            {fields.map((field, index) => (
                <Box key={field.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, mt: 3 }}>
                    <Box>
                        <InputLabel sx={{ mb: 0.5, color:'white', fontSize: '1.5rem', textAlign: 'left' }}>Key {index + 1}</InputLabel>
                        <TextField
                            required
                            value={field.key}
                            onChange={(e) => handleUpdate(index, 'key', e.target.value)}
                            placeholder="Enter Key"
                            variant='outlined'
                            size='small'
                            sx={{ width: '300px' }}
                        />
                    </Box>
                    <Box>
                        <InputLabel sx={{ mb: 0.5, color:'white', fontSize: '1.5rem', textAlign: 'left' }}>Value {index + 1}</InputLabel>
                        {field.isDate ? (
                            <DateField
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(val) => {
                                    if (!val || !val.isValid()) {
                                        handleUpdate(index, 'value', null);
                                        return;
                                    }
                                    handleUpdate(index, 'value', val.toDate().toISOString());
                                }}
                                format="DD/MM/YYYY"
                                sx={{ width: '500px' }}
                            />
                            
                            ) : (
                            <TextField
                                required
                                value={field.value}
                                onChange={(e) => handleUpdate(index, 'value', e.target.value)}
                                placeholder="Enter Value"
                                variant='outlined'
                                size='small'
                                sx={{ width: '500px'}}
                            />
                        )}
                    </Box>
                    <Box sx={{ mt: 5, display: 'flex', gap: 1}}>
                        {/* Toggle field type between date and string */}
                        <ToggleButton 
                            value='date' 
                            selected={field.isDate} 
                            onChange={() => handleUpdate(index, 'isDate', !field.isDate )} 
                            sx={{mr: 2}}
                        >
                            <CalendarMonthIcon fontSize="small" />
                        </ToggleButton>
                        {/* Remove field */}
                        <ToggleButton onClick={() => handleDelete(index)}>
                            <DeleteIcon fontSize="small" color="error"/>
                        </ToggleButton>
                    </Box>
                </Box>
            ))}

            {/* Add field button with simple cap of 5 */}
            <Tooltip title="Add up to 5 fields" placement="right" arrow slotProps={{tooltip: { sx: { fontSize: '1rem'}}}}>
                <Button 
                    onClick={addFormField} 
                    variant="contained"
                    disabled={fields.length >= 5}
                >
                    Add Field
                </Button>
            </Tooltip>

            {/* Submit/reset controls + snackbar feedback */}
            <Box sx={{ pt: 3, display: 'flex', justifyContent: 'start' }}>
                <SubmitVCButton 
                    payload={identityCredential} 
                    onSuccess={resetForm} 
                    avatarFile={avatarFile} 
                    setAvatarFile={setAvatarFile}
                    setOpen={setOpen}
                    setMessage={setMessage}
                    setAlertType={setAlertType} 
                />
                <SnackbarAlert msg={message} open={open} setOpen={setOpen} type={alertType} />
                <Button 
                    sx={{ ml: 3}} 
                    variant="outlined" 
                    endIcon={<ClearIcon />} 
                    color="error" 
                    size="large"
                    onClick={resetForm}
                >
                    CANCEL
                </Button>
            </Box>
        </Box>
    )
}