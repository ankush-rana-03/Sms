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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access and try again.');
      onError('Camera access denied');
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
              <Typography color="text.secondary">
                Camera not started
              </Typography>
            </Box>
          </Box>
        )}

        {isStreaming && (
          <Box sx={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: 300, objectFit: 'cover' }}
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
              }}
            />
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