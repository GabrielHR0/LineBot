const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const lineBotRoutes = require('./src/routes/lineBotRoutes')
const ProductRoutes = require('./src/routes/ProductRoutes')
const SubProductRoutes = require('./src/routes/SubProductRoutes')


const middleware = express();

middleware.use(express.json());
middleware.use(cors({}));
middleware.use(morgan('dev'));

middleware.use('/lineBot', lineBotRoutes);
middleware.use('/Product', ProductRoutes);
middleware.use('/SubProduct', SubProductRoutes);


//Heath check
middleware.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

middleware.use((error, req, res, next) => {
      console.error(error.stack);
      res.status(500).json({ error: 'Erro interno no servidor' })
})

module.exports = middleware;