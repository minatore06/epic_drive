const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../connection');
const randomString = require('../utils/random_string')

//C - owner
//R - see the content
//U - update the file
//D - delete the file

class File {
    conxstructor(name, path, folderID) {
        if (!name || !path)
            return null

        this._id = new ObjectId();//PK
        this.parentFolder = folderID;//FK
        this.name = name;
        this.uploadDate = Date().now;
        this.path = path;
        do {
            this.share = randomString(16, 'aA#');
        } while (File.findOne({share:this.share}));
    }

    static async insertOne(file) {
        try {
            const db = await connectDB();
            const filesCollection = db.collection('files');
            const result = filesCollection.insertOne(file);
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
            const filesCollection = db.collection('files');
            const result = await filesCollection.findOne(query);
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
            const filesCollection = db.collection('files');
            const result = filesCollection.find(query);
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
            const filesCollection = db.collection('files');
            const result = filesCollection.countDocuments(query);
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
            const filesCollection = db.collection('files');
            const result = filesCollection.updateOne(query, update);
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
            const filesCollection = db.collection('files');
            const result = filesCollection.deleteOne(query);
            closeDB();
            return result;
        } catch (err) {
            console.error('Errore nel recupero dati db:'+err);
            throw err;
        }
    }
}

module.exports = File;