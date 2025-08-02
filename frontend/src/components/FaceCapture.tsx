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
      console.log('=== FACE CAPTURE CAMERA START ===');
      
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

      console.log('=== FACE CAPTURE START ===');
      console.log('Video element:', videoRef.current);
      console.log('Video ready state:', videoRef.current.readyState);
      console.log('Video paused:', videoRef.current.paused);

      // Create image from video
      console.log('Creating face image...');
      const faceImage = await faceRecognitionService.createFaceImageFromVideo(videoRef.current);
      console.log('Face image created, length:', faceImage.length);
      setCapturedImage(faceImage);

      // Detect face and get descriptor
      console.log('Capturing face descriptor...');
      const faceData = await faceRecognitionService.captureFaceFromVideo(videoRef.current);
      console.log('Face data captured:', faceData);

      // Validate face descriptor
      if (!faceData.faceDescriptor || !Array.isArray(faceData.faceDescriptor) || faceData.faceDescriptor.length === 0) {
        throw new Error('Failed to capture valid face descriptor');
      }

      if (mode === 'verify' && existingFaceDescriptor) {
        // Validate existing face descriptor
        if (!Array.isArray(existingFaceDescriptor) || existingFaceDescriptor.length === 0) {
          throw new Error('Invalid stored face descriptor');
        }

        // Compare with existing face
        try {
          const isMatch = await faceRecognitionService.compareFaces(
            faceData.faceDescriptor,
            existingFaceDescriptor
          );

          if (!isMatch) {
            setError('Face does not match. Please try again or contact administrator.');
            onError('Face verification failed');
            return;
          }
        } catch (comparisonError) {
          console.error('Face comparison error:', comparisonError);
          setError('Face verification failed due to technical error. Please try again.');
          onError('Face verification failed');
          return;
        }
      }

      console.log('Calling onFaceCaptured with:', {
        descriptorLength: faceData.faceDescriptor.length,
        imageLength: faceImage.length
      });
      
      onFaceCaptured(faceData.faceDescriptor, faceImage);
      stopStream();
    } catch (err: any) {
      console.error('Face capture error:', err);
      
      // In development, provide a fallback
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using development fallback for face capture due to error:', err);
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
              backgroundColor: '#000',
              display: isStreaming ? 'block' : 'none'
            }}
          />
          
          {isStreaming && (
            <>
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
            </>
          )}
        </Box>

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

        {isStreaming && !capturedImage && (
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Force playing video...');
              videoRef.current?.play().then(() => {
                console.log('Video force played successfully');
              }).catch(err => {
                console.error('Force play failed:', err);
              });
            }}
            sx={{ ml: 1 }}
          >
            Force Play
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