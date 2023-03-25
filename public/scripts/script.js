function get_files(directory) {
    var xmlHttp = new XMLHttpRequest();
    let url = "http://ononoki.ddns.net:8080/getfiles?folder="+directory
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            let files = JSON.parse(xmlHttp.responseText);
            document.getElementById("file_list").innerHTML = "";
            if (directory != '.')
                document.getElementById("file_list").innerHTML += `<p onclick=get_files('${directory}/..')>FILE: ../</p>`;
            files.forEach(file => {
                document.getElementById("file_list").innerHTML += 
                `<p ${file.isDirectory?"onclick=get_files('"+directory+'/'+file.name+"')":""}>FILE: ${file.name}${file.isDirectory?"/":""}</p>`;
            });
        } else if (xmlHttp.readyState == 4 && xmlHttp.status == 403){
            alert("Access denied");
        }
    }
    xmlHttp.open("GET", url, true)
    xmlHttp.send()
}