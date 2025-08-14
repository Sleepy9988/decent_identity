import React, { useState, useMemo } from "react";
import { Box, Button, Tooltip, InputLabel, TextField, ToggleButton } from "@mui/material";
import { DateField } from '@mui/x-date-pickers/DateField';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { SubmitVCButton } from "../Buttons";

import dayjs from 'dayjs';

export default function IdentityForm() {
    const [context, setContext] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState([{key: '', value: '', id: crypto.randomUUID(), isDate: false}]);

    const addFormField = () => {
        if (fields.length < 5) {
            setFields(prev => [...prev, {key: '', value: '', id: crypto.randomUUID(), isDate: false }]);
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

    const resetForm = () => {
        setContext('');
        setDescription('');
        setFields([{key: '', value: '', id: crypto.randomUUID(), isDate: false }]);
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
                        <ToggleButton 
                            value='date' 
                            selected={field.isDate} 
                            onChange={() => handleUpdate(index, 'isDate', !field.isDate )} 
                            sx={{mr: 2}}
                        >
                            <CalendarMonthIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton onClick={() => handleDelete(index)}>
                            <DeleteIcon fontSize="small" color="error"/>
                        </ToggleButton>
                    </Box>
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
                <SubmitVCButton payload={identityCredential} onSuccess={resetForm} />
            </Box>
        </Box>
    )
}