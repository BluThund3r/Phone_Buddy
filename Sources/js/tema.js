window.addEventListener("load", function(){
   
    document.getElementById("btn_tema").onclick = function(){
        var tema = localStorage.getItem("tema");

        if(tema)
            {
                localStorage.removeItem("tema");
                document.getElementById("btn_tema").innerHTML = '<i style="font-size:1.25rem;color: rgb(10, 10, 69);" class="fa-solid fa-moon"></i>';
            }
        else
            {
                localStorage.setItem("tema", "dark");
                document.getElementById("btn_tema").innerHTML = '<i style="font-size:1.25rem;color:rgb(222, 207, 8);" class="fa-solid fa-sun"></i>';
            }

        document.body.classList.toggle("dark");
    }
});