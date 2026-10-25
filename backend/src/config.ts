export interface AppConfig {
  port: number;
  dbPath: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  bcryptRounds: number;
}

/** Reads configuration from environment variables (injectable for tests). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProduction = env.NODE_ENV === 'production';
  const jwtSecret = env.JWT_SECRET ?? (isProduction ? undefined : 'dev-only-insecure-secret-change-me');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }

  return {
    port: Number(env.PORT ?? 4000),
    dbPath: env.DB_PATH ?? './data/dealership.db',
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '2h',
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? 10),
  };
}
