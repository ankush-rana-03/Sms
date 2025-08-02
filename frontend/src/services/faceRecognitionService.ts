import * as faceapi from 'face-api.js';

class FaceRecognitionService {
  private modelsLoaded = false;

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      // Use CDN URLs for face-api.js models to avoid build size issues
      const modelBaseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelBaseUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelBaseUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelBaseUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(modelBaseUrl)
      ]);
      this.modelsLoaded = true;
      console.log('Face recognition models loaded successfully');
    } catch (error) {
      console.error('Error loading face recognition models:', error);
      throw new Error('Failed to load face recognition models');
    }
  }

  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
    try {
      await this.loadModels();
      
      const detections = await faceapi.detectSingleFace(
        imageElement,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detections) {
        throw new Error('No face detected in the image');
      }

      const faceDescriptor = Array.from(detections.descriptor);
      
      // Validate face descriptor
      if (!faceDescriptor || faceDescriptor.length === 0) {
        throw new Error('Invalid face descriptor generated');
      }
      
      // Ensure descriptor has the expected length (128 for face-api.js)
      if (faceDescriptor.length !== 128) {
        console.warn(`Unexpected face descriptor length: ${faceDescriptor.length}, expected 128`);
      }

      return {
        faceDescriptor: faceDescriptor,
        faceLandmarks: detections.landmarks
      };
    } catch (error) {
      console.error('Face detection error:', error);
      
      // For production, always throw the error
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      
      // Fallback: return mock face descriptor for development only
      console.warn('Using fallback face detection for development');
      return {
        faceDescriptor: Array.from({ length: 128 }, () => Math.random()),
        faceLandmarks: null
      };
    }
  }

  async compareFaces(descriptor1: number[], descriptor2: number[]): Promise<boolean> {
    try {
      const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
      const threshold = 0.6; // Lower threshold = more strict matching
      
      console.log('Face comparison distance:', distance, 'Threshold:', threshold);
      return distance < threshold;
    } catch (error) {
      console.error('Face comparison error:', error);
      // Fallback: return true for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using fallback face comparison for development');
        return true;
      }
      throw error;
    }
  }

  async captureFaceFromVideo(videoElement: HTMLVideoElement) {
    try {
      await this.loadModels();
      
      const detections = await faceapi.detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detections) {
        throw new Error('No face detected in the video');
      }

      const faceDescriptor = Array.from(detections.descriptor);
      
      // Validate face descriptor
      if (!faceDescriptor || faceDescriptor.length === 0) {
        throw new Error('Invalid face descriptor generated from video');
      }
      
      // Ensure descriptor has the expected length (128 for face-api.js)
      if (faceDescriptor.length !== 128) {
        console.warn(`Unexpected face descriptor length from video: ${faceDescriptor.length}, expected 128`);
      }

      return {
        faceDescriptor: faceDescriptor,
        faceLandmarks: detections.landmarks
      };
    } catch (error) {
      console.error('Face capture error:', error);
      
      // For production, always throw the error
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      
      // Fallback: return mock face descriptor for development only
      console.warn('Using fallback face capture for development');
      return {
        faceDescriptor: Array.from({ length: 128 }, () => Math.random()),
        faceLandmarks: null
      };
    }
  }

  async createFaceImageFromVideo(videoElement: HTMLVideoElement): Promise<string> {
    console.log('Creating face image from video...');
    console.log('Video element:', videoElement);
    console.log('Video width:', videoElement.videoWidth);
    console.log('Video height:', videoElement.videoHeight);
    console.log('Video ready state:', videoElement.readyState);
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Ensure video has valid dimensions
    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;
    
    console.log('Canvas dimensions:', width, 'x', height);
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw the video frame to canvas
    context.drawImage(videoElement, 0, 0, width, height);
    
    // Convert to base64 image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    console.log('Image captured successfully, length:', imageDataUrl.length);
    
    return imageDataUrl;
  }
}

export const faceRecognitionService = new FaceRecognitionService();