const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');
const { randomString } = require('../utils/random_string')

class User {
    constructor(email, password, ruolo, referal) {
        if (!email || !password || !referal)
            return null

        this._id = new ObjectId();//PK
        this.email = email;
        this.password = password;
        this.ruolo = ruolo?ruolo:"User";
        this.lastSignIn = Date.now();
        this.signupDate = Date.now();
        this.totalSpace = 1;
        this.paidSpace = 0;
        this.referal = referal;
        this.status = "Active";//Active;Blocked;Deactiveted;Deleted
        //autorizzazioni
        //log utente
        //log payments
        //points
    }

    static async insertOne(user) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = await usersCollection.insertOne(user);
            await closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }

    static async findOne(query) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = await usersCollection.findOne(query);
            await closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
    static async find(query) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = usersCollection.find(query);
            await closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
    static async countDocuments(query) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = await usersCollection.countDocuments(query);
            await closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
    static async updateOne(query, update) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = await usersCollection.updateOne(query, update);
            await closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
    static async deleteOne(query) {
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            const result = await usersCollection.deleteOne(query);
            await closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
}

module.exports = User;