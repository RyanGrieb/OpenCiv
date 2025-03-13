export default {
  preset: 'ts-jest', // Use ts-jest preset for TypeScript support
  testEnvironment: 'node', // Keep Node environment
  roots: ['<rootDir>/src', '<rootDir>/tests'], // Search paths
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Transform .ts and .tsx files with ts-jest
  },
  // Optional: Ignore node_modules to avoid unnecessary transformation attempts
  transformIgnorePatterns: ['/node_modules/'],
};