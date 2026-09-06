import * as dotenv from 'dotenv';
import { buildApp } from './app.js';

dotenv.config({ path: '../../.env' });

async function main() {
  const app = await buildApp();

  const port = Number(process.env.PORT) || 3333;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Healthinance API rodando em http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
