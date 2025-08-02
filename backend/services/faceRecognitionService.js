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
      if (!descriptor1 || !descriptor2) {
        throw new Error('Both face descriptors are required');
      }

      if (!Array.isArray(descriptor1) || !Array.isArray(descriptor2)) {
        throw new Error('Face descriptors must be arrays');
      }

      if (descriptor1.length !== descriptor2.length) {
        throw new Error(`Face descriptors must have the same length. Got ${descriptor1.length} and ${descriptor2.length}`);
      }

      // Validate that all elements are numbers
      if (!this.validateFaceDescriptor(descriptor1) || !this.validateFaceDescriptor(descriptor2)) {
        throw new Error('Face descriptors must contain only valid numbers');
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
    try {
      if (!Array.isArray(vector1) || !Array.isArray(vector2)) {
        throw new Error('Both vectors must be arrays');
      }

      if (vector1.length !== vector2.length) {
        throw new Error(`Vectors must have the same length. Got ${vector1.length} and ${vector2.length}`);
      }

      if (vector1.length === 0) {
        throw new Error('Vectors cannot be empty');
      }

      let sum = 0;
      for (let i = 0; i < vector1.length; i++) {
        const val1 = Number(vector1[i]);
        const val2 = Number(vector2[i]);
        
        // Check for NaN or invalid numbers
        if (isNaN(val1) || isNaN(val2)) {
          throw new Error(`Invalid number at index ${i}: ${vector1[i]} or ${vector2[i]}`);
        }
        
        const diff = val1 - val2;
        sum += diff * diff;
      }

      const result = Math.sqrt(sum);
      
      // Check for NaN result
      if (isNaN(result)) {
        throw new Error('Euclidean distance calculation resulted in NaN');
      }

      return result;
    } catch (error) {
      console.error('Error calculating Euclidean distance:', error);
      throw error;
    }
  }

  // Validate face descriptor format
  validateFaceDescriptor(descriptor) {
    try {
      if (!Array.isArray(descriptor)) {
        throw new Error('Face descriptor must be an array');
      }

      if (descriptor.length === 0) {
        throw new Error('Face descriptor cannot be empty');
      }

      // Check if all elements are valid numbers
      for (let i = 0; i < descriptor.length; i++) {
        const num = Number(descriptor[i]);
        if (isNaN(num)) {
          throw new Error(`Invalid number at index ${i}: ${descriptor[i]}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Face descriptor validation error:', error);
      return false;
    }
  }

  // Generate a unique face ID
  generateFaceId() {
    return `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new FaceRecognitionService();