const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');
const { randomString } = require('../utils/random_string')

class User {
    constructor(email, password, ruolo) {
        if (!email || !password)
            return null

        this._id = new ObjectId();//PK
        this.email = email;
        this.password = password;
        this.ruolo = ruolo?ruolo:"User";
        this.lastSignIn = Date.now();
        this.signupDate = Date.now();
        this.totalSpace = 1;
        this.paidSpace = 0;
        do {
            this.referal = randomString(8, 'aA#');
        } while (User.findOne({referal:this.referal}));
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
            const result = usersCollection.insertOne(user);
            closeDB();
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
            closeDB();
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
            closeDB();
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
            const result = usersCollection.countDocuments(query);
            closeDB();
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
            const result = usersCollection.updateOne(query, update);
            closeDB();
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
            const result = usersCollection.deleteOne(query);
            closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
}

module.exports = User;