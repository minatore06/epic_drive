const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');

class User {
    constructor(email, password, ruolo) {
        if (!email || !password)

        this._id = new ObjectId();
        this.email = email;
        this.password = password;
        this.ruolo = ruolo?ruolo:"User";
        this.lastSignIn = Date.now();
        this.signupDate = Date.now();
        this.totalSpace = 1;
        this.paidSpace = 0;
        //referal
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
}

module.exports = User;