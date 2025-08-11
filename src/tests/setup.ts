// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_NAME = 'test_db';
  process.env.DB_USER = 'test_user';
  process.env.DB_PASSWORD = 'test_password';
  // Redis temporarily disabled - keeping env var for configuration structure
  process.env.REDIS_HOST = 'localhost';
  process.env.LOG_LEVEL = 'error';
  
  // Suppress Redis-related warnings during tests
  console.warn = jest.fn().mockImplementation((message) => {
    if (typeof message === 'string' && message.includes('Redis')) {
      return; // Suppress Redis warnings during tests
    }
    // Allow other warnings to show
    console.log('WARNING:', message);
  });
});

afterAll(() => {
  // Clean up after all tests
  jest.clearAllMocks();
});