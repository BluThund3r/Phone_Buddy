window.addEventListener("DOMContentLoaded", function(){
    checkBannerCookie();
    lastProdCookie();
})


function setCookie(nume, val, timpExp, path="/") {
    var d = new Date();
    d.setTime(new Date().getTime() + timpExp);
    document.cookie = `${nume}=${val}; expires=${d.toUTCString()}; path=${path}`;
}

function getCookie(nume) {
    var vectCookies = document.cookie.split(';');
    for(let c of vectCookies){
        c = c.trim();
        if(c.startsWith(nume + "="))
            return c.substring(nume.length + 1);
    }
    return null;
}

function deleteCookie(nume) {
    setCookie(nume, ' ', 0);
}   

function checkBannerCookie() {
    if(getCookie("acceptat_banner")) {
        document.getElementById("banner_cookies").style.display = "none";
    }
    else {
        document.getElementById("banner_cookies").style.display = "block";
        document.getElementById("ok_cookies").onclick = function() {
            document.getElementById("banner_cookies").style.display = "none";
            setCookie("acceptat_banner", "true", 12*60*60*1000);
        }
    }
}

function lastProdCookie() {  
    if(window.location.href.includes("product/")) {
        var nume = document.getElementsByClassName("nume")[0].innerText;
        var id = document.getElementsByClassName("id")[0].innerText.split("t")[1];
        setCookie("nume_ultim_produs", nume, 24*60*60*1000);
        setCookie("id_ultim_produs", id, 24*60*60*1000);
    }
}

function deleteAllCookies() {
    var vectCookies = document.cookie.split(';');
    for(let c of vectCookies){
        c = c.trim();
        let [nume, val] = c.split('=');
        deleteCookie(nume);
    }
}