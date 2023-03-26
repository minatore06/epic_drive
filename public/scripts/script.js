function get_files(directory) {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/getfiles?folder="+directory
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            let files = JSON.parse(xmlHttp.responseText);
            document.getElementById("file_list").innerHTML = "";
            if (directory != '.')
                document.getElementById("file_list").innerHTML += `<p onclick=get_files('${directory}/..')>../</p>`;
            files.forEach(file => {
                if (file.isDirectory)
                    document.getElementById("file_list").innerHTML += `<p onclick='get_files("${directory}/${file.name}")'>FOLDER: ${file.name}/</p>`;
                else
                    document.getElementById("file_list").innerHTML += `<p onclick='download_file("${directory}/${file.name}")'>FILE: ${file.name}</p>`;
            });
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.send()
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