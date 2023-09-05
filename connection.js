const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb+srv://ononoki:ononokiPassword@test.t0hnfyy.mongodb.net/?retryWrites=true&w=majority';
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

const closeDB = async() => {
    try {
        await client.close()
    } catch (err) {
        console.log('Errore nella chiusura del db:', err);
    }
}

module.exports = { connectDB, closeDB };