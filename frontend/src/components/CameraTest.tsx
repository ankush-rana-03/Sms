import React, { useRef, useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';

const CameraTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startCamera = async () => {
    try {
      setError('');
      addLog('Starting camera test...');
      
      // Check browser support
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not supported');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      addLog('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      addLog('Camera access granted!');
      addLog(`Stream tracks: ${stream.getTracks().length}`);
      
      if (videoRef.current) {
        addLog('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          addLog('Video metadata loaded');
          videoRef.current?.play().then(() => {
            addLog('Video started playing successfully!');
            setIsStreaming(true);
          }).catch(err => {
            addLog(`Failed to play video: ${err.message}`);
            setError(`Play error: ${err.message}`);
          });
        };
        
        videoRef.current.onerror = (e) => {
          addLog(`Video error: ${e}`);
          setError('Video error occurred');
        };
        
        videoRef.current.oncanplay = () => {
          addLog('Video can play');
        };
        
        videoRef.current.onplay = () => {
          addLog('Video is playing');
        };
      }
      
    } catch (err: any) {
      addLog(`Camera error: ${err.message}`);
      setError(`Camera error: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        addLog(`Stopping track: ${track.kind}`);
        track.stop();
      });
      setIsStreaming(false);
      addLog('Camera stopped');
    }
  };

  const checkDevices = async () => {
    try {
      addLog('Checking available devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      addLog(`Found ${videoDevices.length} video devices:`);
      videoDevices.forEach(device => {
        addLog(`- ${device.label || 'Unknown camera'}`);
      });
    } catch (err: any) {
      addLog(`Device check error: ${err.message}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>
        Camera Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button onClick={startCamera} variant="contained" sx={{ mr: 1 }}>
          Start Camera
        </Button>
        <Button onClick={stopCamera} variant="outlined" sx={{ mr: 1 }}>
          Stop Camera
        </Button>
        <Button onClick={checkDevices} variant="outlined">
          Check Devices
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
            maxWidth: 640,
            height: 480,
            backgroundColor: '#000',
            border: '2px solid #ccc'
          }}
        />
      </Box>

      <Typography variant="h6" gutterBottom>
        Debug Logs:
      </Typography>
      <Box
        sx={{
          height: 200,
          overflow: 'auto',
          bgcolor: '#f5f5f5',
          p: 2,
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}
      >
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </Box>
    </Box>
  );
};

export default CameraTest;