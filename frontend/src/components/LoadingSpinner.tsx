
import React, { memo } from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  overlay?: boolean;
  open?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ 
  message = 'Loading...', 
  size = 40, 
  overlay = false,
  open = true 
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(overlay && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999
        })
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (overlay) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        {content}
      </Backdrop>
    );
  }

  return content;
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
