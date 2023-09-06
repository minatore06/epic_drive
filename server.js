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
process.env.CSRF_SECRET = require('crypto').randomBytes(128).toString('hex');

const httpsOptions = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert"),
    ca: fs.readFileSync("ca.pem")
};

const app = express();

const corsOptions = {
    origin: 'https://ononoki.ddns.net',
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'authorization,X-Csrf-Token,Content-Type',
    exposedHeader: 'authorization,X-Csrf-Token',
    credentials: true,
    maxAge: 1800
}

console.log("epico")

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: true,
    cookie: {secure: true, httpOnly: true, sameSite:'strict', maxAge: 60 * 30 * 1000}//cambiare a true quando impostato https
}));
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'",'ononoki.ddns.net'],
        scriptSrc: ["'self'", "'unsafe-inline'",'ononoki.ddns.net'],
        scriptSrcAttr: ["'self'","'unsafe-inline'",'ononoki.ddns.net'],
        styleSrc: ["'self'","'unsafe-inline'",'ononoki.ddns.net'],
        imgSrc: ["'self'",'ononoki.ddns.net'],
        connectSrc: ["'self'",'ononoki.ddns.net'],
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
app.use(cookieParser());
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
});
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
});
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
});
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
});
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
});
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
});
app.post('/createUser', async(req, res) => {
    let {email, password, ruolo} = req.body.profilo;

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
        User.insertOne(new User(email, password, ruolo, async() => {
            let referal;
            console.log("getting referal\n")
            do {
                referal = randomString(8, 'aA#');
            } while (await User.findOne({referal:referal}));
            console.log("got referal\n")
            return referal;
        }))
            .then(() => {
                //create work area
                generateCTRFToken(req, res);
                const token = generateAccessToken({ "email": email, "ruolo": ruolo });
                res.json(token)
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
        generateCTRFToken(req, res);
        const token = generateAccessToken({"email":req.body.email, "ruolo":ruolo});
        res.json(token);
    });
});
app.get('/logout', async(req, res) => {
    const token = req.headers['authorization']?req.headers['authorization'].split(' ')[1]:null;
    if (!token) return res.status(401).json({message:'missing token'})

    res.clearCookie('_csrf_token');
    res.clearCookie('_csrf_hashed');
    req.session.destroy();
    res.status(200).redirect('/');
});
app.post('/authenticateToken', async(req, res) => {
    let {token} = req.body;

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user)=>{
        if(err){
            console.log(err)
            if(err.name == "TokenExpiredError")return res.status(403).location("https://ononoki.ddns.net/#out")
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

function generateCTRFToken(req, res){
    let options = {
        //maxAge:
        httpOnly: true,
        signed: true
    }

    req.session.csrfToken = require('crypto').randomBytes(128).toString('hex');
    res.cookie('_csrf_token', req.session.csrfToken, options);
    res.cookie('_csrf_hased', require('crypto').createHash('sha256').update(req.sessionStore.csrfToken+process.env.CSFT_SECRET, 'binary').digest('base64'), options)
}

//MIDDLEWARE

function authenticateToken(req, res, next){
    let token = req.headers['authorization']?req.headers['authorization'].split(' ')[1]:"";
    if (!token) return res.status(401).json({message:'missing token'})
    console.log(token?"sasso":"sesso")
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user)=>{
        if(err){
            console.log(err)
            if(err.name == "TokenExpiredError")return res.status(401).json({message:'expired token'})
            return res.status(401).json({message:'invalid token'})
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
    if (!req.signedCookies['_csrf_hashed'])
        return res.status(403).json({message: 'missing CSRF token'});
    if (require('crypto').createHash('sha256').update(req.headers['x-csrf-token']+process.env.CSFT_SECRET, 'binary').digest('base64') !== req.signedCookies['_csrf_hashed'])
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