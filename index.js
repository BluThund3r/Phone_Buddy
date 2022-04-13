const express = require("express");
const fs = require("fs");
const sharp = require("sharp");
const {Client} = require("pg");
const sass = require("sass");
const ejs = require("ejs");
var client = new Client({user:"test_user", password:"15082002", database:"phone_buddy", host:"localhost", port:5432});
const formidable= require('formidable');
const crypto= require('crypto');
const session= require('express-session');


client.connect();


app = express();

app.set("view engine", "ejs");


app.use("/Sources", express.static(__dirname + "/Sources"));    

optiuniMeniu = [];

client.query("select * from unnest(enum_range(null::categ_accesorii))", function(err, rezCateg){
  optiuniMeniu = rezCateg.rows;
 
});

app.use("/*", function(req, res, next){
  res.locals.categorii = optiuniMeniu;
  //console.log(`res.locals.categorii : \ntype = ${typeof res.locals.categorii}`);
  // res.locals.propGenerala="Ceva care se afiseaza pe toate pag";
  
  next();

});

// app.get("/products", function(req, res){
//   client.query("select * from unnest(enum_range(null::categ_accesorii))", function(err, rezCateg){
//       var cond_where = req.query.tip ? `typ='${req.query.tip}'` : "1=1";
//       client.query("select * from accessories", function(err, rezQuery){
//         console.log(rezQuery);
//         console.log(err);
//         res.render("pagini/products", {produse: rezQuery.rows, optiuni: rezCateg.rows});
//       });
//   })
// });

app.get("/gallery", function(req, res){
  nr_pos = [4, 9, 16]
  nrimag = nr_pos[Math.floor(Math.random() * nr_pos.length)];
  res.render('pagini/gallery', {imagini:obImagini.imagini, nrimag: nrimag});
})

app.get("*/galerie-animata.css", function(req, res){
  var sirScss = fs.readFileSync(__dirname+"/Sources/sass/galerie_animata.scss").toString("utf8");
  var culoareAleatoare = nrimag;
  rezScss = ejs.render(sirScss, {nrimag: nrimag});
  console.log(rezScss); 
  var caleScss = __dirname + "/temp/galerie_animata.scss";
  fs.writeFileSync(caleScss, rezScss);

  try{
  rezCompilare = sass.compile(caleScss, {sourceMap:true});
  console.log(rezCompilare);
  var caleCss = __dirname + "/temp/galerie_animata.css";
  fs.writeFileSync(caleCss, rezCompilare.css);
  res.setHeader("Content-Type", "text/css");
  res.sendFile(caleCss);
  }

  catch (err){
    console.log(err);
    res.send("Eroare");
  }
})

app.get(["/", "/index", "/home"], function(req, res){
  // res.sendFile(__dirname + "/index1.html");
  
  client.query("select * from produse", function(err, resQuery){
    if(err)
      console.log(err);
    else{
      console.log(resQuery);
      res.render("pagini/index", {ip: req.ip, imagini:obImagini.imagini, produse: resQuery.rows});
    }
  })
})

app.get("/products", function(req, res){
  client.query("select min(pret) from accessories", function(err, rezMinp){
    console.log(rezMinp)
    client.query("select max(pret) from accessories", function(err, rezMaxp){
      console.log(rezMaxp)
      client.query("select distinct color from accessories", function(err, rezCulori){
        console.log(rezCulori)
        console.log(err)
        if(req.query.type){
          conditie = `categorie = '${req.query.type}'`;
        }
        else{
          conditie = "1 = 1";
        }
        client.query("select * from accessories where " + conditie, function(err, rezQuery){
          console.log(rezQuery);
          console.log(err);
          res.render("pagini/products", {produse: rezQuery.rows, culori: rezCulori.rows, maxPrice: rezMaxp.rows[0], minPrice: rezMinp.rows[0]});
        });
    });
    
    })
  })
});

app.get("/product/:id", function(req, res){
  client.query(`select * from accessories where id = ${req.params.id}`, function(err, rezQuery){
    console.log(rezQuery);
    console.log(err);
    res.render("pagini/product", {prod: rezQuery.rows[0]});
  });
});

app.get("/eroare", function(req, res){
  randeazaEroare(res, 1, "Titlu Schimbat");
});


// app.get("/about", function(req, res){
//   // res.sendFile(__dirname + "/index1.html");
//   res.render("pagini/about");
// })

//------------------------ utilizatori ---------------------------//
parolaServer = "tehniciweb"
app.post("/inreg", function(req, res){
    var formular = new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFisier){
        var parolaCriptata = crypto.scryptSync(campuriText.parola, parolaServer, 64).toString('hex');
        var comandaInserare = `insert into utilizatori (username, nume, prenume, parola, email. culoare_chat) values ('${campuriText.username}', '${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}')`;
        client.query(comandaInserare, function(err, rezInserare){
            if(err)
              console.log(err);
        })
      });
})


app.get("/*.ejs", function(req, res){
  // res.sendFile(__dirname + "/index1.html");
  randeazaEroare(res, 403);
})

app.get("/*", function(req, res){
  console.log(req.url);
  res.render("pagini" + req.url, {imagini:obImagini.imagini}, function(err, resRender){
    if(err){
      if(err.message.includes("Failed to lookup view")){
        console.log(err);
        randeazaEroare(res, 404);
      }
      else{
        console.log(err)
        res.send("Eroare");
      }
    }
    else{
      console.log(resRender);
      res.send(resRender);
    }
  });
  console.log("generala: ", req.url);
  res.end();
})

function creeazaImagini(){
  var buf=fs.readFileSync(__dirname+"/Sources/json/galerie.json").toString("utf8");
  obImagini=JSON.parse(buf);//global
  //console.log(obImagini);

  console.log(obImagini);
  for (let imag of obImagini.imagini){
      let nume_imag, extensie;
      [nume_imag, extensie]=imag.cale_fisier.split(".");// "abc.de".split(".") ---> ["abc","de"]
      let dim_mic=150;
      
      imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
      //console.log(imag.mic);

      imag.mare=`${obImagini.cale_galerie}/${imag.cale_fisier}`;
      if (!fs.existsSync(imag.mic))
          sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);


      let dim_mediu = 300
      imag.mediu=`${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png`
      if (!fs.existsSync(imag.mediu))
        sharp(__dirname+"/"+imag.mare).resize(dim_mediu).toFile(__dirname+"/"+imag.mediu);
  }

}
creeazaImagini();

function creeazaErori(){
  var buf=fs.readFileSync(__dirname+"/Sources/json/erori.json").toString("utf8");
  obErori=JSON.parse(buf);
  console.log(obErori);
}

creeazaErori();

function randeazaEroare(res, identificator, titlu, text, imagine){

  console.log(obErori);
  var eroare = obErori.erori.find(function(elem){return identificator == elem.identificator});
  titlu = titlu || (eroare && eroare.titlu) || "Eroare - eroare";
  text = text || (eroare && eroare.text) || "Paragraf eroare";
  imagine = imagine || (eroare && obErori.cale_baza + "/" + eroare.imagine) || "Sources/pictures/erori/interzis.png";


  if(eroare && eroare.status)
      res.status(eroare.identificator).render("pagini/eroare_generala", {titlu:eroare.titlu, text:eroare.text, imagine:obErori.cale_baza + "/" + eroare.imagine});
  else{
      res.render("pagini/eroare_generala", {titlu:titlu, text:text, imagine:imagine});
    }
}



// app.listen(8080);
var s_port=process.env.PORT || 8080;
app.listen(s_port);
console.log("A pornit!!!");