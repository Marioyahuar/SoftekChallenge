export interface EnvironmentConfig {
  database: {
    host: string;
    name: string;
    user: string;
    password: string;
    port: number;
  };
  // Redis temporarily disabled - keeping configuration structure for easy re-enabling
  redis: {
    host: string;
    port: number;
  };
  apis: {
    swapiBaseUrl: string;
    pokeApiBaseUrl: string;
  };
  aws: {
    region: string;
    cognitoUserPoolId: string;
  };
  app: {
    cacheTimeMinutes: number;
    apiRateLimitRpm: number;
    logLevel: string;
    nodeEnv: string;
    adminUserIds: string[];
  };
}

export const environment: EnvironmentConfig = {
  database: {
    host: process.env.DB_HOST || "localhost",
    name: process.env.DB_NAME || "starwars_pokemon_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: parseInt(process.env.DB_PORT || "3306"),
  },
  // Cache configuration - using DynamoDB in production
  cache: {
    tableName: process.env.CACHE_TABLE_NAME || "star-wars-pokemon-api-dev-cache",
    ttlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || "30"),
  },
  // Redis temporarily disabled - configuration kept for easy re-enabling
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  apis: {
    swapiBaseUrl: process.env.SWAPI_BASE_URL || "https://swapi.info/api/",
    pokeApiBaseUrl: process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2",
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || "",
  },
  app: {
    cacheTimeMinutes: parseInt(process.env.CACHE_TTL_MINUTES || "30"),
    apiRateLimitRpm: parseInt(process.env.API_RATE_LIMIT_RPM || "60"),
    logLevel: process.env.LOG_LEVEL || "info",
    nodeEnv: process.env.NODE_ENV || "development",
    adminUserIds: (process.env.ADMIN_USER_IDS || "admin")
      .split(",")
      .map((id) => id.trim()),
  },
};
