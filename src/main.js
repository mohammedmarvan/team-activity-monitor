import express from 'express';
import bodyParser from 'body-parser';
import askRoutes from './routes/askRoutes.js';
import logger from './utils/logger.js';
import morgan from 'morgan';
import dotenv from 'dotenv';

// load .env
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

// Routes
app.use('/', askRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
