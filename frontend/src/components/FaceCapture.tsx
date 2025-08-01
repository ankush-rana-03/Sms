import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import { Camera, PhotoCamera, Check, Close } from '@mui/icons-material';
import { faceRecognitionService } from '../services/faceRecognitionService';

interface FaceCaptureProps {
  onFaceCaptured: (faceDescriptor: number[], faceImage: string) => void;
  onError: (error: string) => void;
  mode?: 'register' | 'verify';
  existingFaceDescriptor?: number[];
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onFaceCaptured,
  onError,
  mode = 'register',
  existingFaceDescriptor
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

    const startStream = async () => {
    try {
      setError(null);
      console.log('Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      console.log('Camera access granted, setting up video...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('Video started playing');
            setIsStreaming(true);
          }).catch(err => {
            console.error('Failed to play video:', err);
            setError('Failed to start video playback');
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setError('Failed to start video stream');
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };
        
        videoRef.current.onplay = () => {
          console.log('Video is playing');
        };
      }
      } catch (err: any) {
        console.error('Camera access error:', err);
        let errorMessage = 'Camera access denied. Please allow camera access and try again.';
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera access is not supported in this browser. Please use a modern browser.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access blocked due to security restrictions. Please use HTTPS.';
        }
        
        // In development, provide a fallback option
        if (process.env.NODE_ENV === 'development') {
          console.warn('Camera access failed in development, using fallback');
          setError(errorMessage + ' (Development: Using fallback mode)');
          // Don't call onError in development to allow fallback
          return;
        }
        
        setError(errorMessage);
        onError(errorMessage);
      }
  };

  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current) return;

    try {
      setIsCapturing(true);
      setError(null);

      // Create image from video
      const faceImage = await faceRecognitionService.createFaceImageFromVideo(videoRef.current);
      setCapturedImage(faceImage);

      // Detect face and get descriptor
      const faceData = await faceRecognitionService.captureFaceFromVideo(videoRef.current);

      if (mode === 'verify' && existingFaceDescriptor) {
        // Compare with existing face
        const isMatch = await faceRecognitionService.compareFaces(
          faceData.faceDescriptor,
          existingFaceDescriptor
        );

        if (!isMatch) {
          setError('Face does not match. Please try again or contact administrator.');
          onError('Face verification failed');
          return;
        }
      }

      onFaceCaptured(faceData.faceDescriptor, faceImage);
      stopStream();
    } catch (err: any) {
      console.error('Face capture error:', err);
      
      // In development, provide a fallback
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using development fallback for face capture');
        const mockFaceData = {
          faceDescriptor: Array.from({ length: 128 }, () => Math.random()),
          faceLandmarks: null
        };
        
        // Create a simple image from video for development
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        const fallbackImage = canvas.toDataURL('image/jpeg');
        
        onFaceCaptured(mockFaceData.faceDescriptor, fallbackImage);
        setCapturedImage(fallbackImage);
        stopStream();
        return;
      }
      
      const errorMessage = err.message || 'Failed to capture face';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startStream();
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom align="center">
        {mode === 'register' ? 'Register Face' : 'Verify Face'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', mb: 2 }}>
        {!isStreaming && !capturedImage && (
          <Box
            sx={{
              width: '100%',
              height: 300,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: 'grey.300',
            }}
          >
            <Box textAlign="center">
              <Camera sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Camera not started
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Start Camera" to begin
              </Typography>
              {process.env.NODE_ENV === 'development' && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                  Note: Camera requires HTTPS in production
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {isStreaming && (
          <Box sx={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ 
                width: '100%', 
                height: 300, 
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200,
                height: 200,
                border: '2px solid #fff',
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              Position your face in the circle
            </Box>
          </Box>
        )}

        {capturedImage && (
          <Box sx={{ position: 'relative' }}>
            <img
              src={capturedImage}
              alt="Captured face"
              style={{ width: '100%', height: 300, objectFit: 'cover' }}
            />
            <IconButton
              onClick={retakePhoto}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {!isStreaming && !capturedImage && (
          <Button
            variant="contained"
            startIcon={<Camera />}
            onClick={startStream}
            disabled={isCapturing}
          >
            Start Camera
          </Button>
        )}

        {!isStreaming && !capturedImage && (
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Refreshing camera...');
              stopStream();
              setTimeout(() => {
                startStream();
              }, 500);
            }}
            sx={{ ml: 1 }}
          >
            Refresh Camera
          </Button>
        )}

        {process.env.NODE_ENV === 'development' && !isStreaming && !capturedImage && (
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Testing camera access...');
              navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                  const videoDevices = devices.filter(device => device.kind === 'videoinput');
                  console.log('Available video devices:', videoDevices);
                  if (videoDevices.length === 0) {
                    setError('No camera devices found');
                  } else {
                    setError(`Found ${videoDevices.length} camera device(s). Try starting camera again.`);
                  }
                })
                .catch(err => {
                  console.error('Error enumerating devices:', err);
                  setError('Failed to check camera devices');
                });
            }}
            sx={{ ml: 1 }}
          >
            Test Camera
          </Button>
        )}

        {isStreaming && !capturedImage && (
          <Button
            variant="contained"
            startIcon={isCapturing ? <CircularProgress size={20} /> : <PhotoCamera />}
            onClick={captureFace}
            disabled={isCapturing}
          >
            {isCapturing ? 'Processing...' : 'Capture Face'}
          </Button>
        )}

        {capturedImage && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Check />}
            disabled
          >
            Face Captured
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        {mode === 'register' 
          ? 'Position your face in the circle and click capture to register your face.'
          : 'Position your face in the circle and click capture to verify your identity.'
        }
      </Typography>
    </Paper>
  );
};

export default FaceCapture;