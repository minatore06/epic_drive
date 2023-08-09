const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');

class User {
    constructor(email, password) {
        this._id = new ObjectId();
        this.email = email;
        this.password = password;
    }

    static async insertOne(user) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = usersCollection.insertOne(user);
            closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
}

module.exports = User;