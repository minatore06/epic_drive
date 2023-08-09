const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'epic-drive-db';
const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

const connectDB = async() => {
    try {
        await client.connect();
        return client.db(dbName);
    } catch (error) {
        console.error('Errore con la connessione al database:', err);
        throw err;
    }
}

module.exports = connectDB;