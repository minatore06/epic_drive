const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const https = require("https");
const bodyParser = require("body-parser");
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const { randomString } = require('./utils/random_string');
const User = require('./models/user');
const File = require('./models/file');
const Folder = require('./models/folder');
const Authorization = require('./models/authorization');

dotenv.config();
process.env.TOKEN_SECRET = require('crypto').randomBytes(128).toString('hex');
process.env.SESSION_SECRET = require('crypto').randomBytes(128).toString('hex');
process.env.COOKIE_SECRET = require('crypto').randomBytes(128).toString('hex');
process.env.CSRF_SECRET = require('crypto').randomBytes(128).toString('hex');
const CSRF_HASH = require('crypto').createHash('sha256');

const httpsOptions = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert"),
    ca: fs.readFileSync("ca.pem")
};

const app = express();

const corsOptions = {
    origin: 'https://ononoki.it',
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'authorization,Content-Type',
    exposedHeader: 'authorization',
    credentials: true,
    maxAge: 1800
}

console.log("epico")

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: true,
    cookie: {secure: true, httpOnly: true, sameSite:'lax', maxAge: 60 * 30 * 1000}//cambiare a true quando impostato https
}));
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'",'ononoki.it'],
        scriptSrc: ["'self'", "'unsafe-inline'",'ononoki.it'],
        scriptSrcAttr: ["'self'","'unsafe-inline'",'ononoki.it'],
        styleSrc: ["'self'","'unsafe-inline'",'ononoki.it'],
        imgSrc: ["'self'",'ononoki.it'],
        connectSrc: ["'self'",'ononoki.it'],
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
app.use(cors(corsOptions));
app.options(corsOptions, cors());
app.use(express.static(path.join(__dirname,'/public')));
app.use(express.json());
app.use(fileUpload());

app.get('/', (req, res)=>{
    res.sendFile("./login.html", {root: __dirname})
});
app.get('/home', (req, res)=>{
    res.sendFile("./index.html", {root: __dirname})
});
app.get('/getfiles', authenticateToken, (req, res) => {
    let user = req.session["user"];
    let fullPath = path.join(__dirname, 'storage', user.id, req.query.folder);
    let result = new Array();
    console.log(fullPath);

    if (!fullPath.includes(path.join(__dirname, 'storage')))
        return res.status(403).json({"message":"access denied"});

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
});
app.get('/sendfile', authenticateToken, (req, res) => {
    let user = req.session.user;
    let fullPath = path.join(__dirname, 'storage', user.id, req.query.path);
    console.log(fullPath);

    if (!fullPath.includes(path.join(__dirname, 'storage')))
        return res.status(403).json({"message":"access denied"});

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
});
app.post('/createdirectory', checkCSRFToken, authenticateToken, (req, res) => {
    let user = req.session.user;
    let fullPath = path.join(__dirname, 'storage', user.id, req.query.path, req.query.name);
    console.log(fullPath);

    if (!fullPath.includes(path.join(__dirname, 'storage')))
        return res.status(403).json({"message":"access denied"});

    fs.mkdir(fullPath, {recursive: true}, (err) => {
        if (err)
            return res.status(400).send();
        res.status(201).send();
    });
});
app.post('/uploadfile', checkCSRFToken, authenticateToken, (req, res) => {
    let user = req.session.user;
    let fullPath = path.join(__dirname, 'storage', user.id, req.query.path);
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
});
app.delete('/deleteFile', checkCSRFToken, authenticateToken, (req, res) => {
    let user = req.session.user;
    let fullPath = path.join(__dirname, 'storage', user.id, req.query.path);
    console.log(fullPath);

    if (!fullPath.includes(path.join(__dirname, 'storage')))
        return res.status(403).json({"message":"access denied"});

    fs.unlink(fullPath, (err) => {
        if (err){
            console.log(err);
            return res.status(400).send();
        }
        res.status(200).send();
    })
});
app.delete('/deleteDir', checkCSRFToken, authenticateToken, (req, res) => {
    let user = req.session.user;
    let fullPath = path.join(__dirname, 'storage', user.id, req.query.path);
    console.log(fullPath);

    if (!fullPath.includes(path.join(__dirname, 'storage')))
        return res.status(403).json({"message":"access denied"});
    
    fs.rmdir(fullPath, (err) => {
        if (err){
            if (err.code == "ENOTEMPTY")
                return res.status(409).send();
            console.log(err);
            return res.status(400).send();
        }
        res.status(200).send();
    })
});
app.post('/createUser', async(req, res) => {
    let {email, password, ruolo} = req.body.profilo;
    let user;

    //search if present in db (403)
    try {
        if (await User.findOne({email:email}))
            return (res.status(403).send("email already present"));
        if (!email || !password || !ruolo)
            return (res.status(400).send("missing data"));
    } catch (err) {
        return (res.status(500).send("generic internal error"));
    }
    bcrypt.hash(password, 10, (err, hash) => {
        if (err)
            return (res.status(500).send("generic internal error"));
        password = hash;
        //add to db
        user = new User(email, password, ruolo, async() => {
            let referal;
            console.log("getting referal\n")
            do {
                referal = randomString(8, 'aA#');
            } while (await User.findOne({referal:referal}));
            console.log("got referal\n")
            return referal;
        })
        User.insertOne(user)
            .then(() => {
                //create work area
                let workArea = path.join(__dirname, 'storage', user._id.toString());
        
                fs.mkdir(workArea, {recursive: true}, (err) => {
                    if (err)
                        return res.status(500).send();
                    req.session.user = {
                        "id": user._id.toString(),
                        "email": user.email,
                    }
                    generateCSRFToken(req, res);
                    const token = generateAccessToken({ "email": email, "ruolo": ruolo });
                    res.json(token)
                });
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send("generic internal error");
            });
    });
});
app.post('/createAuthentication', async(req, res) => {
    let {email, password} = req.body.profilo;
    let ruolo;
    let user;

    //search if present in db
    try {
        if (!email || !password)
            return (res.status(403).send("missing data"));
        user = await User.findOne({email:email});
        if (!user)
            return (res.status(400).send("email not found"));
    } catch (err) {
        return (res.status(500).send("generic internal error"));
    }
    //403 wrong password/email not present
    bcrypt.compare(password, user.password, (err, result) => {
        if (err)
            return (res.status(500).send("generic internal error"));
        if (!result)
            return (res.status(403).send("wrong password"));
        req.session.user = {
            "id": user._id.toString(),
            "email": user.email,
        }
        generateCSRFToken(req, res);
        const token = generateAccessToken({"email":req.body.email, "ruolo":ruolo});
        res.json(token);
    });
});
app.get('/logout', async(req, res) => {
/*     const token = req.headers['authorization']?req.headers['authorization'].split(' ')[1]:null;
    if (!token) return res.status(401).json({message:'missing token'}) */

    res.clearCookie('_csrf_token');
    res.clearCookie('_csrf_hashed');
    req.session.destroy();
    res.redirect(200, '/');
});
app.post('/authenticateToken', async(req, res) => {
    let {token} = req.body;

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user)=>{
        if(err){
            console.log(err)
            if(err.name == "TokenExpiredError")return res.status(403).location("https://ononoki.it/#out")
            return res.status(401).json({message:"Token invalid"});
        }
        return res.sendStatus(200);
    })
});
/*     app.get('/getCsrfToken', authenticateToken, (req, res) => {
    const csrfToken = req.csrfToken();
    res.json({ csrfToken });
}),     */
app.get('*', (req, res) =>{
    res.status(404).sendFile("./404.html", {root: __dirname})
});

function generateAccessToken(user){
    return jwt.sign({ "email": user.email, "ruolo": user.ruolo }, process.env.TOKEN_SECRET, { expiresIn: '30m' });
}

function generateCSRFToken(req, res){
    let options = {
        //maxAge:
        httpOnly: true,
        signed: true
    }
    let csrfToken = require('crypto').randomBytes(128).toString('hex');

    res.cookie('_csrf_token', csrfToken, options);
    res.cookie('_csrf_hashed', CSRF_HASH.copy().update(csrfToken+process.env.CSRF_SECRET, 'binary').digest('base64'), options)
}

//MIDDLEWARE

function authenticateToken(req, res, next){
    const token = req.headers['authorization']?req.headers['authorization'].split(' ')[1]:null;
    const sessionId = req.signedCookies['connect.sid'];
    if (!token || token == "null") return res.status(401).json({message:'missing token'})
    
    jwt.verify(token, process.env.TOKEN_SECRET, (err)=>{
        let oldSes;
        let user;
        if(err){
            console.log(err)
            if(err.name == "TokenExpiredError")return res.status(401).json({message:'expired token'})
            return res.status(401).json({message:'invalid token'})
        }
        console.log("1current session ID1: " + req.sessionID)
        console.log("1client session ID1: " + sessionId)
        req.sessionID = sessionId;
        console.log("2current session ID2: " + req.sessionID)
        console.log("2client session ID2: " + sessionId)
        oldSes = req.session;
        user = req.session["user"];
        req.session.regenerate((err) => {
            if (err)
                return res.status(500).json({message: 'failed to renew session'})
            console.log("new session ID: " + req.sessionID)
            Object.assign(req.session, oldSes);
            Object.assign(req.session["user"], user);
            next()
        })
    })
}

function checkCSRFToken(req, res, next) {
    if (!req.signedCookies['_csrf_hashed'] || !req.signedCookies['_csrf_token'])
        return res.status(403).json({message: 'missing CSRF token'});
    if (CSRF_HASH.copy().update(req.signedCookies['_csrf_token']+process.env.CSRF_SECRET, 'binary').digest('base64') !== req.signedCookies['_csrf_hashed'])
        return res.status(403).json({message: 'CSRF token invalid'});
    next();
}

https.createServer(httpsOptions, app).listen(443, (req, res) => {
    console.log("Server listening port 443");
});
/*
admin (authenticated, access to everything)
member (authenticated, with personal space)
user (authenticated, no paid space)
guest (not autheticated)
*/