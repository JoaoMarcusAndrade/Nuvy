import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import cookieParser from 'cookie-parser';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(cors({
  origin: 'https://nuvy-1.onrender.com',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

const PORT = 3000;
app.listen(PORT, () => {
  //powershell -ExecutionPolicy Bypass
  console.log(`Server rodando em http://localhost:${PORT}`);
});