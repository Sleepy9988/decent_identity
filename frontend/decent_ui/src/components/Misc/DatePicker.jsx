import * as React from 'react';
import { Box } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

/**
 * DatePickerComponent 
 * 
 * Wrapper for selecting an expiry data.
 * - Uses Dayjs adapter via LocalizationProvider
 * - Restricts to past-disabled, only shows date, no time
 * 
 * Props:
 * - value: Dayjs object or null, current selection. 
 * - onChange: callback to handle date changes.
 */

export default function DatePickerComponent({value, onChange}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ mt: 1 }}>
            <DateTimePicker 
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