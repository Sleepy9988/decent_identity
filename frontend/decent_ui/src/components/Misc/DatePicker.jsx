import * as React from 'react';
import { Box } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function DatePickerComponent({value, onChange}) {

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ mt: 1 }}>
            <DatePicker 
                label="Expiry Date" 
                name="startDate" 
                value={value}
                onChange={onChange}
                slotProps={{ textField: { fullWidth: true } }}
                disablePast
                views={['year', 'month', 'day']}
            />
        </Box>
    </LocalizationProvider>
    );
}