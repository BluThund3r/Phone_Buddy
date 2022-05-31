 window.onload= function(){
    var formular=document.getElementById("form_inreg");
    if(formular){
    formular.onsubmit= function(){
            if(document.getElementById("parl").value!=document.getElementById("rparl").value){
                alert("\"Password\" and \"Confirm Password\" fields must contain the same value!");
                return false;
            }
            console.log(formular);
            return true;
        }
    }
 }