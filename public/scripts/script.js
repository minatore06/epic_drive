var cur_path;

function checkLogin() {
    let token = sessionStorage.getItem('token');

    if (location.hash == '#out') {
        location.hash = '';
        return logout();
    }

    if (token)
    {
        let xmlHttp = new XMLHttpRequest();

        const url = 'https://ononoki.it/authenticateToken';
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    if (window.location.pathname == '/')
                        window.location.replace("https://ononoki.it/home")
                }
                else if (xmlHttp.status == 403 || xmlHttp.status == 401)
                    logout();
            }
        }
        xmlHttp.open('POST', url);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.send(JSON.stringify({"token":token}));
    }/*  else {
        if (window.location.pathname == '/')
            window.location.replace("https://ononoki.it/home")
    } */
}

function toggleSignInUp(signin) {
    if (signin) {
        document.getElementsByClassName("signin")[0].style.display = "none";
        document.getElementsByClassName("signup")[0].style.display = "block";
        document.getElementById("change-login-display").innerHTML = '<a onclick="toggleSignInUp(0)">signin</a> | sign-up';
    }
    else {
        document.getElementsByClassName("signin")[0].style.display = "block";
        document.getElementsByClassName("signup")[0].style.display = "none";
        document.getElementById("change-login-display").innerHTML = 'signin | <a onclick="toggleSignInUp(1)">sign-up</a>';
    }
}

function logout() {
    let xmlHttp = new XMLHttpRequest();

    const url = 'https://ononoki.it/logout';
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                sessionStorage.removeItem('token');
                window.location.replace("https://ononoki.it/");
            }
        }
    }
    xmlHttp.open('GET', url);
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send();
}

async function login() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;

    document.getElementById("email-label").innerHTML = "<b>e-mail</b>";
    document.getElementById("password-label").innerHTML = "<b>password</b>";

    if(!email)
        return (document.getElementById("email-label").innerHTML += "<br>Required field");
    if(!password)
        return (document.getElementById("password-label").innerHTML += "<br>Required field");

    //password = await hash(password);
    let profileJson = {
        "email": email,
        "password":password,
        "ruolo":""
    }

    let xmlHttp = new XMLHttpRequest();

    const url = 'https://ononoki.it/createAuthentication';
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                    const token = JSON.parse(xmlHttp.responseText);
                    sessionStorage.setItem("token", token);
                    window.location.replace("https://ononoki.it/home");
            } else if (xmlHttp.status == 403 || xmlHttp.status == 400) {
                document.getElementById("email-label").innerHTML += "<br>Wrong email";
                document.getElementById("password-label").innerHTML += "<br>Wrong password";
            } else if (xmlHttp.status == 403 || xmlHttp.status == 500) {
                alert("Server error, retry later");
            }
        }
    }
    xmlHttp.open('POST', url);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify({"profilo":profileJson}));
}

async function signup() {
    let email = document.getElementById('email1').value;
    let password = document.getElementById('password1').value;
    let rpassword = document.getElementById('password2').value;

    document.getElementById("email-label1").innerHTML = "<b>e-mail</b>";
    document.getElementById("password-label1").innerHTML = "<b>password</b>";
    document.getElementById("password-label2").innerHTML = "<b>confirm password</b>";

    if(!email)
        return (document.getElementById("email-label1").innerHTML += "<br>Required field");
    if(!password)
        return (document.getElementById("password-label1").innerHTML += "<br>Required field");
    if(!rpassword)
        return (document.getElementById("password-label2").innerHTML += "<br>Required field");
    if (password !== rpassword)
        return (document.getElementById("password-label2").innerHTML += "<br>Password doesn't match");

    rpassword = null;
    //password = await hash(password);
    let profileJson = {
        "email": email,
        "password":password,
        "ruolo":"user"
    }

    let xmlHttp = new XMLHttpRequest();

    const url = 'https://ononoki.it/createUser';
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                    const token = JSON.parse(xmlHttp.responseText);
                    sessionStorage.setItem("token", token);
                    window.location.replace("https://ononoki.it/home");
            } else if (xmlHttp.status == 403) {
                document.getElementById("email-label1").innerHTML += "<br>E-mail already registered";
            } else if (xmlHttp.status == 500) {
                alert("Server error, retry later");
            }
        }
    }
    xmlHttp.open('POST', url);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify({"profilo":profileJson}));
}

function get_files(directory) {
    var xmlHttp = new XMLHttpRequest();
    let url = "https://ononoki.it/getfiles?folder="+directory
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            let files = JSON.parse(xmlHttp.responseText);
            document.getElementById("uploadBTN").setAttribute("onClick", `uploadFiles('${directory}')`)
            document.getElementById("file_list").innerHTML = "";
            if (directory != '.')
                document.getElementById("file_list").innerHTML += `<p onclick=get_files('${directory}/..')>../</p>`;
            files.forEach(file => {
                if (file.isDirectory)
                    document.getElementById("file_list").innerHTML += `<p><div onclick='get_files("${directory}/${file.name}")'>FOLDER: ${file.name}/</div><button onclick='delete_dir("${directory}","${file.name}")'>Delete</button></p>`;
                else
                    document.getElementById("file_list").innerHTML += `<p><div onclick='download_file("${directory}/${file.name}")'>FILE: ${file.name}</div><button onclick='delete_file("${directory}","${file.name}")'>Delete</button></p>`;
            });
            document.getElementById("file_list").innerHTML += `<button onclick='create_folder("${directory}")'>Create Folder</button>`
        }else if (xmlHttp.readyState == 4 && xmlHttp.status == 401) {
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing token" || response.message == "invalid token" || response.message == "expired token")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function create_folder(path) {
    var xmlHttp = new XMLHttpRequest();
    let dir_name = window.prompt("Folder name", "folder");
    let url = "https://ononoki.it/createdirectory?path="+path+"&name="+dir_name
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201){
            alert("Folder created successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("Folder creation error");
        }else if (xmlHttp.readyState == 4 && xmlHttp.status == 401) {
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing token" || response.message == "invalid token" || response.message == "expired token")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing CSRF token" || response.message == "CSRF token invalid")
                logout();
            alert("Access denied");
        }
    }
    xmlHttp.open("POST", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function delete_file(path, file) {
    var xmlHttp = new XMLHttpRequest();
    let url = "https://ononoki.it/deleteFile?path="+path+"/"+file
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            alert("File deleted successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("File deletion error");
        }else if (xmlHttp.readyState == 4 && xmlHttp.status == 401) {
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing token" || response.message == "invalid token" || response.message == "expired token")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing CSRF token" || response.message == "CSRF token invalid")
                logout();
            alert("Access denied");
        }
    }
    xmlHttp.open("DELETE", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function delete_dir(path, file) {
    var xmlHttp = new XMLHttpRequest();
    let url = "https://ononoki.it/deleteDir?path="+path+"/"+file
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            alert("Folder deleted successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("Folder deletion error");
        }else if (xmlHttp.readyState == 4 && xmlHttp.status == 401) {
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing token" || response.message == "invalid token" || response.message == "expired token")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing CSRF token" || response.message == "CSRF token invalid")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 409){
            alert("Folder not empty");
        }
    }
    xmlHttp.open("DELETE", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function uploadFiles(path) {
    let files = document.getElementById("fileInput").files;
    var xmlHttp = new XMLHttpRequest();
    let url = "https://ononoki.it/uploadfile?path="+path
    var formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('file', file)
    })
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201){
            alert("Upload succeded")
        }else if (xmlHttp.readyState == 4 && xmlHttp.status == 401) {
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing token" || response.message == "invalid token" || response.message == "expired token")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing CSRF token" || response.message == "CSRF token invalid")
                logout();
            alert("Access denied");
        }
    }
    xmlHttp.open("POST", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send(formData)
    alert("SALTO!!!");

}

function download_file(path){
    var xmlHttp = new XMLHttpRequest();
    let url = "https://ononoki.it/sendfile?path="+path
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            let file = xmlHttp.response;
            _html5Saver(file, xmlHttp.getResponseHeader("Content-Disposition").match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1]);
        }else if (xmlHttp.readyState == 4 && xmlHttp.status == 401) {
            let response = JSON.parse(xmlHttp.response);
            if (response.message == "missing token" || response.message == "invalid token" || response.message == "expired token")
                logout();
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.responseType = 'blob';
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
    alert("SALTO!!!");
}

function _html5Saver(blob , fileName) {
    fileName = fileName.substring(1, fileName.length-1);
    console.log(fileName);
    var a = document.createElement("a");
    document.body.appendChild(a);
    var url = window.URL.createObjectURL(blob);
    a.style = "display: none";
    a.href = url;
    a.download = fileName;
    a.click();

    document.body.removeChild(a);
}

/* async function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
} */
/* 
function getCsrfToken() {
    var xmlHttp = new XMLHttpRequest();
    let url = "https://ononoki.it/getCsrfToken";

    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201){
            return (xmlHttp.responseText.csrfToken);
        } else if (xmlHttp.readyState == 4){
            return (NULL);
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
} */

const getCookieValue = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)