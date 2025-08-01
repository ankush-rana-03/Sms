import React, { useRef, useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';

const SimpleCameraTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      setError('');
      console.log('=== SIMPLE CAMERA TEST START ===');
      
      // Step 1: Check browser support
      console.log('1. Checking browser support...');
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not supported');
      }
      console.log('✅ navigator.mediaDevices supported');
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      console.log('✅ getUserMedia supported');

      // Step 2: Request camera access
      console.log('2. Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      console.log('✅ Camera access granted');
      console.log('Stream tracks:', stream.getTracks().length);

      // Step 3: Set up video element
      console.log('3. Setting up video element...');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('✅ Video srcObject set');
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('✅ Video started playing');
            setIsStreaming(true);
          }).catch(err => {
            console.error('❌ Failed to play video:', err);
            setError(`Play error: ${err.message}`);
          });
        };
        
        videoRef.current.onerror = (e) => {
          console.error('❌ Video error:', e);
          setError('Video error occurred');
        };
      }
      
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      setError(`Camera error: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
      console.log('✅ Camera stopped');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Simple Camera Test
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        This is a minimal camera test to isolate any issues.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button onClick={startCamera} variant="contained" sx={{ mr: 1 }}>
          Start Camera
        </Button>
        <Button onClick={stopCamera} variant="outlined">
          Stop Camera
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            maxWidth: 400,
            height: 300,
            backgroundColor: '#000',
            border: '2px solid #ccc'
          }}
        />
      </Box>

      <Typography variant="h6" gutterBottom>
        Status: {isStreaming ? '✅ Streaming' : '❌ Not Streaming'}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Check browser console (F12) for detailed logs.
      </Typography>
    </Box>
  );
};

export default SimpleCameraTest;