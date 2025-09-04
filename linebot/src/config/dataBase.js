const mongoose = require('mongoose');
require('dotenv').config();

const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/lineDB';

const connectDb = async () => {
    try {
        await mongoose.connect(DB_URL);
         console.log('MongoDB conectado!');
    } catch (error) {
        console.error('Erro na conexão: ', error.message);
        process.exit(1);
    }
};

module.exports = connectDb;