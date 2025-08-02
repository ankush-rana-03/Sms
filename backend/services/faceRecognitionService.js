// Backend face recognition service for comparing face descriptors
// This is a simplified version that works with the frontend face-api.js descriptors

class FaceRecognitionService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the service (for future use with actual face recognition libraries)
  async initialize() {
    this.isInitialized = true;
    console.log('Face recognition service initialized');
  }

  // Compare two face descriptors and return similarity score
  async compareFaces(descriptor1, descriptor2) {
    try {
      console.log('Comparing face descriptors:');
      console.log('Descriptor 1 length:', descriptor1?.length);
      console.log('Descriptor 2 length:', descriptor2?.length);
      console.log('Descriptor 1 type:', typeof descriptor1);
      console.log('Descriptor 2 type:', typeof descriptor2);

      if (!descriptor1 || !descriptor2) {
        throw new Error('Both face descriptors are required');
      }

      if (!Array.isArray(descriptor1) || !Array.isArray(descriptor2)) {
        throw new Error('Face descriptors must be arrays');
      }

      // Validate descriptor lengths
      if (descriptor1.length === 0 || descriptor2.length === 0) {
        throw new Error('Face descriptors cannot be empty');
      }

      if (descriptor1.length !== descriptor2.length) {
        console.error('Descriptor length mismatch:');
        console.error('Descriptor 1:', descriptor1.length, 'elements');
        console.error('Descriptor 2:', descriptor2.length, 'elements');
        console.error('Descriptor 1 sample:', descriptor1.slice(0, 5));
        console.error('Descriptor 2 sample:', descriptor2.slice(0, 5));
        throw new Error(`Face descriptors must have the same length. Got ${descriptor1.length} and ${descriptor2.length}`);
      }

      // Validate that all elements are numbers
      for (let i = 0; i < descriptor1.length; i++) {
        if (typeof descriptor1[i] !== 'number' || typeof descriptor2[i] !== 'number') {
          throw new Error('Face descriptors must contain only numbers');
        }
      }

      // Calculate Euclidean distance between descriptors
      const distance = this.calculateEuclideanDistance(descriptor1, descriptor2);
      
      // Convert distance to similarity score (0-1, where 1 is perfect match)
      // Using a common formula: similarity = 1 / (1 + distance)
      const similarity = 1 / (1 + distance);
      
      console.log(`Face comparison - Distance: ${distance}, Similarity: ${similarity}`);
      
      return similarity;
    } catch (error) {
      console.error('Error comparing faces:', error);
      throw error;
    }
  }

  // Calculate Euclidean distance between two vectors
  calculateEuclideanDistance(vector1, vector2) {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < vector1.length; i++) {
      const diff = vector1[i] - vector2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  // Validate face descriptor format
  validateFaceDescriptor(descriptor) {
    if (!Array.isArray(descriptor)) {
      throw new Error('Face descriptor must be an array');
    }

    if (descriptor.length === 0) {
      throw new Error('Face descriptor cannot be empty');
    }

    // Check if all elements are numbers
    for (let i = 0; i < descriptor.length; i++) {
      if (typeof descriptor[i] !== 'number') {
        throw new Error('Face descriptor must contain only numbers');
      }
    }

    return true;
  }

  // Generate a unique face ID
  generateFaceId() {
    return `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new FaceRecognitionService();