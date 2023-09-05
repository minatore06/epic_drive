const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');
const randomString = require('../utils/random_string')

//C - add stuff into folder
//R - view content of folder
//U - change folder
//D - delete folder

class Folder {
    conxstructor(name, path, folderID) {
        if (!name || !path)
            return null

        this._id = new ObjectId();//PK
        this.parentFolder = folderID;//FK
        this.name = name;
        this.creationDate = Date().now;
        this.path = path;
        do {
            this.share = randomString(16, 'aA#');
        } while (Folder.findOne({share:this.share}));
    }

    static async insertOne(folder) {
        try {
            const db = await connectDB();
            const foldersCollection = db.collection('folders');
            const result = foldersCollection.insertOne(folder);
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
            const foldersCollection = db.collection('folders');
            const result = await foldersCollection.findOne(query);
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
            const foldersCollection = db.collection('folders');
            const result = foldersCollection.find(query);
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
            const foldersCollection = db.collection('folders');
            const result = foldersCollection.countDocuments(query);
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
            const foldersCollection = db.collection('folders');
            const result = foldersCollection.updateOne(query, update);
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
            const foldersCollection = db.collection('folders');
            const result = foldersCollection.deleteOne(query);
            closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
}

module.exports = Folder;