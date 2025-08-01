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

      return {
        faceDescriptor: Array.from(detections.descriptor),
        faceLandmarks: detections.landmarks
      };
    } catch (error) {
      console.error('Face detection error:', error);
      // Fallback: return mock face descriptor for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using fallback face detection for development');
        return {
          faceDescriptor: Array.from({ length: 128 }, () => Math.random()),
          faceLandmarks: null
        };
      }
      throw error;
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

      return {
        faceDescriptor: Array.from(detections.descriptor),
        faceLandmarks: detections.landmarks
      };
    } catch (error) {
      console.error('Face capture error:', error);
      // Fallback: return mock face descriptor for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using fallback face capture for development');
        return {
          faceDescriptor: Array.from({ length: 128 }, () => Math.random()),
          faceLandmarks: null
        };
      }
      throw error;
    }
  }

  async createFaceImageFromVideo(videoElement: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}

export const faceRecognitionService = new FaceRecognitionService();