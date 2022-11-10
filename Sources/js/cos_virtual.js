window.addEventListener("DOMContentLoaded",function(){
	prod_sel = this.localStorage.getItem("cos-virtual");

	if (prod_sel){
		var vect_ids= [];
		var vect_qttys = []
		for(let prod of prod_sel.split(","))  {
			let id, qtty;
			[id, qtty] = prod.split("|");
			vect_ids.push(id);
			vect_qttys.push(qtty);
		}

		
		
		fetch("/produse_cos", {		

			method: "POST",
			headers:{'Content-Type': 'application/json'},
			
			mode: 'cors',		
			cache: 'default',
			body: JSON.stringify({
				ids_prod: vect_ids
			})
		})
		.then(function(rasp){ console.log(rasp); x=rasp.json(); console.log(x); return x})
		.then(function(objson) {
	
			console.log(objson);
			let main = document.getElementsByTagName("main")[0];
			var total_price = document.getElementById("total-price");
			let counter = 0;
			var sumPrices = 0;
			for (let prod of objson){
				sumPrices += prod.pret * vect_qttys[counter];
				let article = document.createElement("article");
				article.classList.add("cos-virtual");
				var p = document.createElement("p");
				p.innerHTML = prod.nume;
				p.style.fontWeight = "bold";
				var imagine = document.createElement("img");
				imagine.className = "img_cos";
				imagine.src = "/Sources/pictures/products/" + prod.imagine;
				article.appendChild(imagine);
				article.appendChild(p);
				var divDetails = document.createElement("div");
				divDetails.className = "details";
				var details = document.createElement("p");
				details.innerHTML = prod.descriere + '<br><br><span style="font-weight:bold;">Quantity: </span>' + vect_qttys[counter] + '<br><span style="font-weight:bold;">Price: </span>' + (prod.pret * vect_qttys[counter]) + " RON	"
					+ '<br><span style="font-weight:bold;">Returnable: </span>' + (prod.returnable? "Yes" : "No") + '<br><span style="font-weight:bold;">Discount: </span>' + prod.discount + "%";
				var removeBtn = document.createElement("button");
				removeBtn.className = "remove-btn";
				removeBtn.id = prod.id;
				removeBtn.innerText = "Remove";
				
				divDetails.appendChild(details);
				divDetails.appendChild(removeBtn);
				article.appendChild(divDetails);
				main.insertBefore(article, total_price);


				/* TO DO 
				pentru fiecare produs, creăm un articol in care afisam imaginea si cateva date precum:
				- nume, pret, imagine, si alte caracteristici

				
				document.getElementsByTagName("main")[0].insertBefore(divCos, document.getElementById("cumpara"));
				*/
				counter ++;
			}

			let cnt2 = 0;
			var removeBtns = document.getElementsByClassName("remove-btn");
			for(let rb of removeBtns) {
				rb.onclick = function() {
					let rIndex = vect_ids.indexOf(this.id);
					vect_ids.splice(rIndex, 1);
					vect_qttys.splice(rIndex, 1);
					let vectProd = [];
					for(let i = 0; i < vect_ids.length; i ++) 
						vectProd.push(vect_ids[i] + "|" + vect_qttys[i]);
					localStorage.setItem("cos-virtual", vectProd.join(","));
					window.location.reload();
				}
				cnt2 ++;
			}

			let totalPrice = document.getElementById("total-price");
			totalPrice.innerHTML += " " + sumPrices + " RON";
		}
		).catch(function(err){console.log(err)});




		document.getElementById("cumpara").onclick=function(){
				//TO DO: preluare vector id-uri din localStorage

			fetch("/cumpara", {		
	
				method: "POST",
				headers:{'Content-Type': 'application/json'},
				
				mode: 'cors',		
				cache: 'default',
				body: JSON.stringify({ 
					ids_prod: vect_ids,
					qttys_prod: vect_qttys
				})
			})
			.then(function(rasp){ console.log(rasp); return rasp.text()})
			.then(function(raspunsText) {
		   
				console.log(raspunsText);
				//Ștergem conținutul paginii
				//creăm un paragraf în care scriem răspunsul de la server
				//Dacă utilizatorul e logat și cumpărarea a reușit, 
				
				let p=document.createElement("p");
				p.innerHTML=raspunsText;
				document.getElementsByTagName("main")[0].innerHTML="";
				document.getElementsByTagName("main")[0].appendChild(p)
				if(!raspunsText.includes("You have to log in"))
					localStorage.removeItem("cos-virtual");
		   
			}
			).catch(function(err){console.log(err)});
		}


	}
	else{
		document.getElementsByTagName("main")[0].innerHTML=
		'<h2 style="font-size:3em; text-align:center; background-color:rgba(255, 255, 255, 0.221); height:auto; border:2px solid var(--border-color); border-radius:10px; padding:5%;">Your Shopping Cart is Empty!</h2>';
	}
});

