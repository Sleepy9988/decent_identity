import React from "react";
import { Box, Button, Card, Typography, CardContent, Divider } from "@mui/material";

export default function IdentityCard ({ identity }) {
    const { context, description, issued, decrypted_data } = identity;
    
    return (
        <Card sx={{ p: 2, backgroundColor: '#2d4963', borderRadius: 3, color: '#fff', minHeight: 300 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    {context}
                </Typography>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#ccc' }}>
                    {description}
                </Typography>

                <Divider sx={{ my: 2, borderColor: 'white'}} />

                <Box component="dl" sx={{ mb: 2 }}>
                    {Object.entries(decrypted_data).map(([key, value]) => (
                        <Box key={key} sx={{ display: 'flex', mb: 1 }}>
                            <Typography component="dt" sx={{ fontWeight: 600, minWidth: 100 }}>
                                {key}:
                            </Typography>
                            <Typography component="dd" sx={{ ml: 1 }}>
                                {value}
                            </Typography>
                        </Box>
                    ))}
                </Box> 
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                    Issued: {new Date(issued).toLocaleString()}
                </Typography>
            </CardContent>
        </Card>
    );
}