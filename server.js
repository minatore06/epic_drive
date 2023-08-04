const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
process.env.TOKEN_SECRET = require('crypto').randomBytes(64).toString('hex');

const app = express();

const corsOptions = {
    origin: 'http://ononoki.ddns.net',
}

console.log("epico")

app.use(cors(corsOptions));
app.options(corsOptions, cors())
app.use(express.static(__dirname+'/public'));
app.use(express.json())
app.use(fileUpload());

app.listen(80, ()=>{
    app.get('/', (req, res)=>{
        res.sendFile("./login.html", {root: __dirname})
    }),
    app.get('/home', (req, res)=>{
        res.sendFile("./index.html", {root: __dirname})
    }),
    app.get('/getfiles', authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.folder);
        console.log(fullPath);
        if (!fullPath.includes(path.join(__dirname, 'storage')))
            return res.status(403).send();
        let result = new Array();
        fs.readdir(fullPath, { withFileTypes: true }, (error, files) => {
            if (error) {
                console.log(error);
                return res.status(400).send(error.code);
            }
            files.forEach( file => {
                result.push({"name":file.name, "isDirectory":file.isDirectory()})
            });
            console.log(result);
            res.send(JSON.stringify(result));
        })
    }),
    app.get('/sendfile', authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path);
        console.log(fullPath);
        if (!fullPath.includes(path.join(__dirname, 'storage')))
        return res.status(403).send();
        res.download(fullPath, (error) => {
            if (error){
                console.log(error);
                try {
                    res.status(400).send(error.code);
                } catch (error) {
                    console.log(error);
                }
            }
        })
    }),
    app.post('/createdirectory', authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path, req.query.name);
        console.log(fullPath);
        if (!fullPath.includes(path.join(__dirname, 'storage')))
            return res.status(403).send();
        fs.mkdir(fullPath, {recursive: true}, (err) => {
            if (err)
                return res.status(400).send();
            res.status(200).send();
        });
    }),
    app.post('/uploadfile', authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path);
        let files = req.files.file;
        console.log(fullPath);
        console.log(files);

        if (Array.isArray(files)){
            Object.keys(files).forEach(key => {
                let file = files[key]
                file.mv(fullPath + `/${file.name}`, (err) => {
                    if (err){
                        console.log(err);
                        return res.status(400).send();
                    }
                })
            })
        } else {
            files.mv(fullPath + `/${files.name}`, (err) => {
                if (err){
                    console.log(err);
                    return res.status(400).send();
                }
            })
        }
        res.status(200).send();
    }),
    app.delete('/deleteFile', authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path);
        console.log(fullPath);
        if (!fullPath.includes(path.join(__dirname, 'storage')))
            return res.status(403).send();
        fs.unlink(fullPath, (err) => {
            if (err){
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).send();
        })
    }),
    app.delete('/deleteDir', authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path);
        console.log(fullPath);
        if (!fullPath.includes(path.join(__dirname, 'storage')))
            return res.status(403).send();
        fs.rmdir(fullPath, (err) => {
            if (err){
                if (err.code == "ENOTEMPTY")
                    return res.status(409).send();
                console.log(err);
                return res.status(400).send();
            }
            res.status(200).send();
        })
    }),
    app.post('/createAuthentication', async(req, res) => {
        let {email} = req.body;
        let ruolo;
        //search if present in db
        const token = generateAccessToken({"email":req.body.email, "password":req.body.crypted, "ruolo":ruolo});
        res.json(token);
    }),
    app.get('*', (req, res) =>{
        res.status(404).sendFile("./404.html", {root: __dirname})
    })
})

function generateAccessToken(user){
    return jwt.sign({"email":user.email, "password":user.password, "ruolo":user.ruolo}, process.env.TOKEN_SECRET, {expiresIn: '30m'});
}

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user)=>{
        if(err){
            console.log(err)
            if(err.name == "TokenExpiredError")return res.location("http://ononoki.ddns.net:8443/#out")
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}