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

        const url = 'http://ononoki.ddns.net/authenticateToken';
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    window.location.replace("http://ononoki.ddns.net/home")
                }
                else if (xmlHttp.status == 403 || xmlHttp.status == 401)
                    logout();
            }
        }
        xmlHttp.open('POST', url);
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.send(JSON.stringify({"token":token}));
    }
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

    const url = 'http://ononoki.ddns.net/logout';
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                sessionStorage.setItem('token', "");
            }
        }
    }
    xmlHttp.open('GET', url);
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send();
}

function login() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;

    document.getElementById("email-label").innerHTML = "<b>e-mail</b>";
    document.getElementById("password-label").innerHTML = "<b>password</b>";

    if(!email)
        return (document.getElementById("email-label").innerHTML += "<br>Required field");
    if(!password)
        return (document.getElementById("password-label").innerHTML += "<br>Required field");

    password = hash(password);
    let profileJson = {
        "email": email,
        "password":password,
        "ruolo":""
    }

    let xmlHttp = new XMLHttpRequest();

    const url = 'http://ononoki.ddns.net/createAuthentication';
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                    const token = JSON.parse(xmlHttp.responseText);
                    sessionStorage.setItem("token", token);
                    window.location.replace("http://ononoki.ddns.net/home");
            } else if (xmlHttp.status == 403 || xmlHttp.status == 400) {
                document.getElementById("email-label").innerHTML += "<br>Wrong email";
                document.getElementById("password-label").innerHTML += "<br>Wrong password";
            } else if (xmlHttp.status == 403 || xmlHttp.status == 500) {
                console.alert("Server error, retry later");
            }
        }
    }
    xmlHttp.open('POST', url);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify({"profilo":profileJson}));
}

function signup() {
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
    password = hash(password);
    let profileJson = {
        "email": email,
        "password":password,
        "ruolo":"user"
    }

    let xmlHttp = new XMLHttpRequest();

    const url = 'http://ononoki.ddns.net/createUser';
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                    const token = JSON.parse(xmlHttp.responseText);
                    sessionStorage.setItem("token", token);
                    window.location.replace("http://ononoki.ddns.net/home");
            } else if (xmlHttp.status == 403) {
                document.getElementById("email-label1").innerHTML += "<br>E-mail already registered";
            } else if (xmlHttp.status == 500) {
                console.alert("Server error, retry later");
            }
        }
    }
    xmlHttp.open('POST', url);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader('X-Csrf-Token', csrfToken)
    xmlHttp.send(JSON.stringify({"profilo":profileJson}));
}

function get_files(directory) {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net/getfiles?folder="+directory
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
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function create_folder(path) {
    const csrfToken = getCookieValue('_csrf_token');
    var xmlHttp = new XMLHttpRequest();
    let dir_name = window.prompt("Folder name", "folder");
    let url = "http://ononoki.ddns.net/createdirectory?path="+path+"&name="+dir_name
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201){
            alert("Folder created successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("Folder creation error");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("POST", url, true)
    xmlHttp.setRequestHeader('X-Csrf-Token', csrfToken)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function delete_file(path, file) {
    const csrfToken = getCookieValue('_csrf_token');
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net/deleteFile?path="+path+"/"+file
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            alert("File deleted successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("File deletion error");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("DELETE", url, true)
    xmlHttp.setRequestHeader('X-Csrf-Token', csrfToken)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function delete_dir(path, file) {
    const csrfToken = getCookieValue('_csrf_token');
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net/deleteDir?path="+path+"/"+file
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            alert("Folder deleted successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("Folder deletion error");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 409){
            alert("Folder not empty");
        }
    }
    xmlHttp.open("DELETE", url, true)
    xmlHttp.setRequestHeader('X-Csrf-Token', csrfToken)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send()
}

function uploadFiles(path) {
    const csrfToken = getCookieValue('_csrf_token');
    let files = document.getElementById("fileInput").files;
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net/uploadfile?path="+path
    var formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('file', file)
    })
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201){
            alert("Upload succeded")
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("POST", url, true)
    xmlHttp.setRequestHeader('X-Csrf-Token', csrfToken)
    xmlHttp.setRequestHeader('Authorization', `Bearer ${sessionStorage.getItem('token')}`);
    xmlHttp.send(formData)
    alert("SALTO!!!");

}

function download_file(path){
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net/sendfile?path="+path
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            let file = xmlHttp.response;
            _html5Saver(file, xmlHttp.getResponseHeader("Content-Disposition").match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1]);
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

function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    });
}
/* 
function getCsrfToken() {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net/getCsrfToken";

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