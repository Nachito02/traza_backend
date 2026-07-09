import { env } from './env.js';

interface Config {
  port: number;
  nodeEnv: string;
}

const config: Config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
};

export default config;
