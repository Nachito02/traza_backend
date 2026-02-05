import app from './app.js';

import config from './config/config.js';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
