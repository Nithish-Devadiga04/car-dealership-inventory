import 'dotenv/config';
import { createApp } from './app';
import { loadConfig } from './config';
import { createDatabase } from './db/database';

const config = loadConfig();
const db = createDatabase(config.dbPath);
const app = createApp({ db, config });

const server = app.listen(config.port, () => {
  console.log(`Dealership API listening on http://localhost:${config.port}`);
});

const shutdown = (): void => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
