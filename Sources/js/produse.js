window.addEventListener("load", function(){
    document.getElementById("inp-pret-min").onchange = function(){
        document.getElementById("infoRangeMin").innerHTML = " (" + this.value + ") ";
    }

    document.getElementById("inp-pret-max").onchange = function(){
        document.getElementById("infoRangeMax").innerHTML = " (" + this.value + ") ";
    }

    document.getElementById("i_datalist").onclick = function(){
        this.value = "";
    }

    function checkNume(str){
        for(let c of str){
            if(!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == ' ' || c == '*'))
                return false;
        }
        return true;
    }

    function checkDescFirstC(str){
        if(str == "")
            return true;    
        let c = str[0];
        if(!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')))
            return false;
        return true;
    }

    function checkCategorie(str){
        let ok = false;
        var tempOptions = document.getElementById("id_lista").getElementsByTagName("option");
        for(let elem of tempOptions){
            if(str == elem.value){
                ok = true;
                break;
            }
        }
        return ok;
    }

    document.getElementById("filtrare").onclick = function(){
        var tempNume = document.getElementById("inp-nume").value.toLowerCase();
        
        if(!checkNume(tempNume)){
            window.alert("The 'Name' field contains invalid characters!\nValid characters: letters ( A - Z, a - z ), digits ( 0 - 9 ), -, *, ' ' ( blank space ).")
            return;
        }

        var valNume = tempNume.split("*");
        if(valNume.length == 1)
            valNume.push("");   

        var valDesc = document.getElementById("inp-descriere").value.toLowerCase();
        if(!checkDescFirstC(valDesc)){
            window.alert("The 'Description contains' field has an invalid fist character!\nValid characters: letters ( A - Z, a - z ), digits ( 0 - 9 ).");
            return;
        }
        else if(valDesc.length > 250){
            window.alert("The 'Description contains' field has a limit of max 250 characters");
            return;
        }

        var ceva = document.getElementById("inp-materiale").getElementsByTagName("option");
        var valMateriale = []
        for(let elem of ceva) 
            if(elem.selected)
                valMateriale.push(elem.value);
        valMateriale = Array.from(valMateriale);

        var butoaneRadio = document.getElementsByName("gr_rad");
        for(let rad of butoaneRadio){
            if(rad.checked){
                var valDiscount = rad.value;
                break;
            }
        }

        var minDiscount, maxDiscount;
        if(valDiscount != "all"){
            
            [minDiscount, maxDiscount] = valDiscount.split(":");
            minDiscount = parseInt(minDiscount);
            maxDiscount = parseInt(maxDiscount);
        }
        else{
            minDiscount = 0;
            maxDiscount = 10000000;
        }

        var valPretMin = document.getElementById("inp-pret-min").value;
        var valPretMax = document.getElementById("inp-pret-max").value;

        var valCategorie = document.getElementById("i_datalist").value;
        if(!checkCategorie(valCategorie)){
            window.alert("You must choose one of the options in the Category list!")
            return;
        }

        var returnable = document.getElementById("i_check1").checked;

        var valCuloare = document.getElementById("inp-culoare").value;

        var articole = document.getElementsByClassName("produs");
        for(let art of articole){
            art.style.display = "none";
            let numeArt = art.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase();

            let cond1 = numeArt.startsWith(valNume[0]) && numeArt.endsWith(valNume[1]);

            let discountArt = parseInt(art.getElementsByClassName("val-discount")[0].innerHTML);

            let cond2 = (minDiscount <= discountArt && discountArt < maxDiscount);

            let pretArt = parseInt(art.getElementsByClassName("val-pret")[0].innerHTML);

            let cond3 = (valPretMin <= pretArt) && (valPretMax >= pretArt);

            let culoareArt = art.getElementsByClassName("val-culoare")[0].innerHTML;

            let cond4 = (valCuloare == "all") || (culoareArt == valCuloare);

            let descArt = art.getElementsByClassName("val-descriere")[0].innerHTML.toLowerCase();

            let cond5 = descArt.includes(valDesc);

            let materialeArt = art.getElementsByClassName("val-materiale")[0].innerHTML;

            let cond6 = true;
            for(let mat of valMateriale)
                if(!materialeArt.includes(mat)){
                    cond6 = false;
                    break;
                }
            
            let returnableArt = art.getElementsByClassName("val-ret")[0].innerHTML;
            let cond7 = !returnable ? true : ((returnableArt == "Yes")? true : false);

            let categorieArt = art.getElementsByClassName("val-categorie")[0].innerHTML;
            let cond8 = (valCategorie == "all") || (categorieArt == valCategorie);

            let conditieFinala = cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7 && cond8;

            if(conditieFinala)
                art.style.display = "block";
        }
    }

    document.getElementById("resetare").onclick=function(){
        var articole = document.getElementsByClassName("produs");
        for(let art of articole){
            art.style.display = "block";
        }

        document.getElementById("inp-nume").value = "";
        document.getElementById("i_datalist").value = "all";
        document.getElementById("inp-descriere").value = "";
        document.getElementById("i_check1").checked = false;
        document.getElementById("i_rad4").checked = true;
        document.getElementById("inp-pret-min").value = document.getElementById("inp-pret-min").min;
        document.getElementById("inp-pret-max").value = document.getElementById("inp-pret-max").max;
        document.getElementById("infoRangeMin").innerHTML = `(${document.getElementById("inp-pret-min").min})`;
        document.getElementById("infoRangeMax").innerHTML = `(${document.getElementById("inp-pret-max").max})`;
        document.getElementById("sel-toate").selected = true;
        var tempMateriale = document.getElementById("inp-materiale").getElementsByTagName("option");
        for(let i = 0; i < tempMateriale.length; i++)
            tempMateriale[i].selected = false;
        
    }

    
    function sortare(semn){
        var articole = document.getElementsByClassName("produs");
        var v_articole = Array.from(articole);
        v_articole.sort(function(a,b){
            let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase();
            let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase();
            if(nume_a != nume_b)
                return semn*(nume_a.localeCompare(nume_b));
            else{
                let desc_a = a.getElementsByClassName("val-descriere")[0].innerHTML.length;
                let desc_b = b.getElementsByClassName("val-descriere")[0].innerHTML.length;
                return semn*(desc_a - desc_b);
            }
        })

        for(let art of v_articole){
            art.parentElement.appendChild(art);
        }

    }

    document.getElementById("sortCrescNume").onclick=function(){ //sorteaza dupa pret si apoi dupa nume
        var arts = document.getElementsByClassName("produs");
        arts = Array.from(arts);
        var exists = false;
        for(let art of arts){
            if(art.style.display != "none"){
                sortare(1);
                exists = true;
                break;
            }
        }
        
        if(!exists){
            window.alert("There are no elements to be sorted!");
        }
    }

    document.getElementById("sortDescrescNume").onclick=function(){ //sorteaza dupa pret si apoi dupa nume
        var arts = document.getElementsByClassName("produs");
        arts = Array.from(arts);
        var exists = false;
        for(let art of arts){
            if(art.style.display != "none"){
                sortare(-1);
                exists = true;
                break;
            }
        }
        
        if(!exists){
            window.alert("There are no elements to be sorted!");
        }
     }

    document.getElementById("calculare").onclick = function(e){
            let old_p = document.getElementById("div_sum");
            if(!old_p){
                var div = document.createElement("div");
                div.id = "div_sum";
                let s = 0;
                var articole = document.getElementsByClassName("produs");
                for(let art of articole){
                    if(art.style.display != "none")
                        s += parseFloat(art.getElementsByClassName("val-pret")[0].innerHTML);
                }

                div.style.height = '50px';
                div.style.fontWeight = 'bold';
                div.style.width = '150px';
                div.style.backgroundColor = "white";
                div.style.color = "var(--highlight-color)"
                div.style.lineHeight = "50px";
                div.style.zIndex = "10";
                div.style.textAlign = "center";
                div.style.position = 'fixed';
                div.style.bottom = '15px';
                div.style.left = '15px';
                div.style.border = "3px solid var(--border-color)";
                div.style.borderRadius = "10px";
                


                div.innerHTML = "<b> Sum: </b>" + s + "     RON";
                var sectiune = document.getElementById("produse");
                sectiune.parentNode.insertBefore(div, sectiune);
                setTimeout(function(){
                    let div_vechi = document.getElementById('div_sum');
                    if(div_vechi){
                        div_vechi.remove();
                    }
                }, 2000)
        
        }
     }
});