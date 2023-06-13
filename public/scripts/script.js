var cur_path;

function get_files(directory) {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/getfiles?folder="+directory
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
    xmlHttp.send()
}

function create_folder(path) {
    var xmlHttp = new XMLHttpRequest();
    let dir_name = window.prompt("Folder name", "folder");
    let url = "http://ononoki.ddns.net:8080/createdirectory?path="+path+"&name="+dir_name
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            alert("Folder created successfully");
            get_files(path);
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 400){
            alert("Folder creation error");
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("POST", url, true)
    xmlHttp.send()
}

function delete_file(path, file) {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/deleteFile?path="+path+"/"+file
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
    xmlHttp.send()
}

function delete_dir(path, file) {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/deleteDir?path="+path+"/"+file
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
    xmlHttp.send()
}

function uploadFiles(path) {
    let files = document.getElementById("fileInput").files;
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/uploadfile?path="+path
    var formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('file', file)
    })
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            alert("Upload succeded")
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("POST", url, true)
    xmlHttp.send(formData)
    alert("SALTO!!!");

}

function download_file(path){
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/sendfile?path="+path
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

/* function uploadFiles() {
    console.log(document.getElementById("fileInput").files[0]);
} */