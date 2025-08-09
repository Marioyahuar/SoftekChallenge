// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_NAME = 'test_db';
  process.env.DB_USER = 'test_user';
  process.env.DB_PASSWORD = 'test_password';
  process.env.REDIS_HOST = 'localhost';
  process.env.LOG_LEVEL = 'error';
});

afterAll(() => {
  // Clean up after all tests
  jest.clearAllMocks();
});