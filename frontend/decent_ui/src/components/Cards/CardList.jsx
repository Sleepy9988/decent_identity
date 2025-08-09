import React from "react";
import { Box } from "@mui/material";
import IdentityCard from "./IdentityCard";

export default function CardList({ identities }) {
    return (
        <Box sx={{ mt: 5, mb: 5, maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 3}}>
            {identities.map((identity) => (
                <IdentityCard key={identity.id} identity={identity}/>
            ))}
        </Box>
    );
}
