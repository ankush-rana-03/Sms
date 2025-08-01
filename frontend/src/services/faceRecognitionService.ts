import * as faceapi from 'face-api.js';

class FaceRecognitionService {
  private modelsLoaded = false;

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      this.modelsLoaded = true;
      console.log('Face recognition models loaded successfully');
    } catch (error) {
      console.error('Error loading face recognition models:', error);
      throw new Error('Failed to load face recognition models');
    }
  }

  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
    await this.loadModels();
    
    try {
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
      throw error;
    }
  }

  async compareFaces(descriptor1: number[], descriptor2: number[]): Promise<boolean> {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const threshold = 0.6; // Lower threshold = more strict matching
    
    console.log('Face comparison distance:', distance, 'Threshold:', threshold);
    return distance < threshold;
  }

  async captureFaceFromVideo(videoElement: HTMLVideoElement) {
    await this.loadModels();
    
    try {
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