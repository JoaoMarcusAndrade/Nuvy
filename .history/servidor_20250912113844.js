import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use('/', routes);

const PORT = 3000;
app.listen(PORT, () => {
  //powershell -ExecutionPolicy Bypass
  console.log(`Server rodando em http://localhost:${PORT}`);
});
