const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const helmet = require('helmet');
const csrf = require('csurf');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
process.env.TOKEN_SECRET = require('crypto').randomBytes(64).toString('hex');
process.env.SESSION_SECRET = require('crypto').randomBytes(64).toString('hex');

const app = express();

const corsOptions = {
    origin: 'http://ononoki.ddns.net',
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'Authorization,X-Csrf-Token,Content-Type',
    exposedHeader: 'Authorization,X-Csrf-Token',
    credentials: true,
    maxAge: 1800,
}

console.log("epico")

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: true,
    cookie: {secure: false, httpOnly: true, sameSite:'strict', maxAge: 60 * 30 * 1000}//cambiare a true quando impostato https
}));
app.use(helmet.contentSecurityPolicy({
    directives: {
        desaultSrc: ["'self'"],
        scryptSrc: ["'self'", "'unsafe-inline'"],
    }
}));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preLoad: true
}));
app.use(helmet.frameguard({action: 'deny'}));
app.use(csrf({cookie: true}));
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
        let result = new Array();
        console.log(fullPath);

        if (!fullPath.includes(path.join(__dirname, 'storage')))
            return res.status(403).send();
    
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
    app.post('/createdirectory', checkCSRFToken, authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path, req.query.name);
        console.log(fullPath);

        if (!fullPath.includes(path.join(__dirname, 'storage')))
            return res.status(403).send();

        fs.mkdir(fullPath, {recursive: true}, (err) => {
            if (err)
                return res.status(400).send();
            res.status(201).send();
        });
    }),
    app.post('/uploadfile', checkCSRFToken, authenticateToken, (req, res) => {
        let fullPath = path.join(__dirname, 'storage', req.query.path);
        let files = req.files.file;
        console.log(fullPath);
        console.log(files);

//413 payload too large

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
        res.status(201).send();
    }),
    app.delete('/deleteFile', checkCSRFToken, authenticateToken, (req, res) => {
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
    app.delete('/deleteDir', checkCSRFToken, authenticateToken, (req, res) => {
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
    app.post('/createUser', async(req, res) => {
        let {email, password, ruolo} = req.body;

        //search if present in db (400)
        //add to db
        const token = generateAccessToken({"email":email, "ruolo":ruolo});
        res.json(token)
    })
    app.post('/createAuthentication', checkCSRFToken, async(req, res) => {
        let {email} = req.body;
        let ruolo;

        //search if present in db
        //403 wrong password/email not present
        const token = generateAccessToken({"email":req.body.email, "ruolo":ruolo});
        res.json(token);
    }),
    app.get('/logout', checkCSRFToken, async(req, res) => {
    })
    app.post('/authenticateToken', checkCSRFToken, async(req, res) => {
        let {token} = req.body;

        jwt.verify(token, process.env.TOKEN_SECRET, (err, user)=>{
            if(err){
                console.log(err)
                if(err.name == "TokenExpiredError")return res.sendStatus(403).location("http://ononoki.ddns.net:8443/#out")
                return res.sendStatus(401)
            }
            res.sendStatus(200);
        })
        
        res.json(token);
    }),
    app.get('/getCsrfToken', (req, res) => {
        const csrfToken = req.csrfToken();
        res.json({ csrfToken });
    }),      
    app.get('*', (req, res) =>{
        res.status(404).sendFile("./404.html", {root: __dirname})
    })
})

function generateAccessToken(user){
    return jwt.sign({"email":user.email, "ruolo":user.ruolo}, process.env.TOKEN_SECRET, {expiresIn: '30m'});
}



//MIDDLEWARE

function authenticateToken(req, res, next){
    const token = req.headers['Authorization']
    //const token = authHeader.split(' ')[1]
    if (!token) return res.sendStatus(401).json({message:'missing token'})

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user)=>{
        if(err){
            console.log(err)
            if(err.name == "TokenExpiredError")return res.sendStatus(401).json({message:'expired token'})
            return res.sendStatus(401).json({message:'invalid token'})
        }
        req.session.regenerate((err) => {
            if (err)
                return res.status(500).json({message: 'failed to renew session'})
            req.session.user = user
            next()
        })
    })
}

function checkCSRFToken(req, res, next) {
    if (req.headers['X-Csrf-Token'] !== req.csrfToken())
        return res.status(403).json({message: 'token CSRF invalid'});
    next();
}
/*
admin (authenticated, access to everything)
member (authenticated, with personal space)
user (authenticated, no personal space)
guest (not autheticated)
*/