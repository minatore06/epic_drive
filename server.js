const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

const corsOptions = {
    origin: 'http://ononoki.ddns.net',
}

console.log("epico")

app.use(cors(corsOptions));
app.options(corsOptions, cors())
app.use(express.static(__dirname+'/public'));
app.use(express.json())


app.listen(80, ()=>{
    app.get('/', (req, res)=>{
        res.sendFile("./index.html", {root: __dirname})
    }),
    app.get('/getfiles', (req, res) => {
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
    app.get('/sendfile', (req, res) => {
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
    app.get('*', (req, res) =>{
        res.status(404).sendFile("./404.html", {root: __dirname})
    })
})
