const http = require('http');
const app = require('./app');
require('dotenv').config();
const connectDb = require('./src/config/dataBase')

const PORT = process.env.PORT || 8080;

connectDb().then(() => {
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error('Falha ao iniciar servidor:', error);
  });