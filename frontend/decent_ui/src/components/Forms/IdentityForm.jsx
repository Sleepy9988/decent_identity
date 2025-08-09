import React, { useState, useMemo } from "react";
import { Box, Button, Tooltip, InputLabel, TextField, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { SubmitVCButton } from "../Buttons";

export default function Form() {
    const [context, setContext] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState([{key: '', value: '', id: crypto.randomUUID() }]);

    const addFormField = () => {
        if (fields.length < 5) {
            setFields(prev => [...prev, {key: '', value: '', id: crypto.randomUUID() }]);
        }
    };

    const handleUpdate = (index, type, value) => {
        setFields(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [type]: value};
            return updated;
        });
    };

    const handleDelete = (indexToRemove) => {
        setFields(prev => prev.filter((_, index) => index !== indexToRemove));
    }

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
        <Box
            component="form"
            sx={{ px: 2, mt: 5, mb: 5 }}
            noValidate
            autoComplete="off"    
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3, alignItems: 'start' }}>
                <Box sx={{ mb: 2 }}>
                    <InputLabel sx={{ mb: 1, color:'white', fontSize: '1.5rem', textAlign: 'left' }}>Context</InputLabel>
                    <TextField
                        required
                        fullWidth
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
                        onChange={(e) => setDescription(e.target.value)}
                        label='Description'
                        variant='outlined'
                        sx={{ width: 500, maxWidth: 500 }}
                    />  
                </Box>
            </Box>

            {fields.map((field, index) => (
                <Box key={field.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
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
                        <TextField
                            required
                            value={field.value}
                            onChange={(e) => handleUpdate(index, 'value', e.target.value)}
                            placeholder="Enter Value"
                            variant='outlined'
                            size='small'
                            sx={{ width: '500px'}}
                        />
                    </Box>
                    <IconButton color="error" sx={{ mt: 5}} onClick={() => handleDelete(index)}>
                        <DeleteIcon fontSize="large"/>
                    </IconButton>
                </Box>
            ))}
            <Tooltip title="Add up to 5 fields" placement="right" arrow slotProps={{tooltip: { sx: { fontSize: '1rem'}}}}>
                <Button 
                    onClick={addFormField} 
                    variant="contained"
                    disabled={fields.length >= 5}
                >
                    Add Field
                </Button>
            </Tooltip>
            <Box sx={{ pt: 3}}>
                <SubmitVCButton payload={identityCredential}/>
            </Box>
        </Box>
    )
}