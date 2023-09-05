const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');
const randomString = require('../utils/random_string')

//Create
//Read
//Update
//Delete

class Authorization {
    conxstructor(userID, resourceID, permission, file) {
        if (!userID || !resourceID || !permission)
            return null

        this._id = new ObjectId();//PK
        this.user = userID;//FK
        this.resource = resourceID;//FK
        this.resourceType = file?'file':'folder';
        this.permission = permission;
    }

    static async insertOne(authorization) {
        try {
            const db = await connectDB();
            const authorizationsCollection = db.collection('authorizations');
            const result = authorizationsCollection.insertOne(authorization);
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
            const authorizationsCollection = db.collection('authorizations');
            const result = authorizationsCollection.findOne(query);
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
            const authorizationsCollection = db.collection('authorizations');
            const result = authorizationsCollection.find(query);
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
            const authorizationsCollection = db.collection('authorizations');
            const result = authorizationsCollection.countDocuments(query);
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
            const authorizationsCollection = db.collection('authorizations');
            const result = authorizationsCollection.updateOne(query, update);
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
            const authorizationsCollection = db.collection('authorizations');
            const result = authorizationsCollection.deleteOne(query);
            closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
}

module.exports = Authorization;