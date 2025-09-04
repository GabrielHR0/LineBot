const mongoose = require("mongoose");
require("dotenv").config();

DB_URL = process.env.MONGO_URI;

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
