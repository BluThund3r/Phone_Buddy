const express = require("express");
const fs = require("fs");
const sharp = require("sharp");
const { Client } = require("pg");
const sass = require("sass");
const ejs = require("ejs");
const localStorage = require("localStorage");
const html_to_pdf = require('html-pdf-node');
const juice=require('juice');
const QRCode = require('qrcode');
const helmet = require('helmet');
const socket = require('socket.io');
const http = require('http');
const formidable = require('formidable');
const crypto = require('crypto');
const session = require('express-session');
const nodemailer = require('nodemailer');
const path = require("path");
const { use } = require("express/lib/application");
const { client_encoding } = require("pg/lib/defaults");
const request=require('request');
const xmljs = require('xml-js');
const mongodb=require('mongodb');
const { cookie } = require("request");

var url = "mongodb://localhost:27017";
if(process.env.SITE_ONLINE) {
  url = "mongodb+srv://ProiectTW:EBcsjeE8qcsdPu0E@cluster0.goevboa.mongodb.net/?retryWrites=true&w=majority";
}

const obGlobal = {
  obImagini: null,
  obErori: null,
  emailServer: "utilizator.proiect2022@gmail.com",
  protocol: null,
  numeDomeniu: null,
  clientMongo:mongodb.MongoClient,
  bdMongo:null,
  port: 5000,
  sirAlphaNum: "",
  extensiiPoze: ["jpg", "jpeg", "png", "bmp", "svg"]
}

obGlobal.clientMongo.connect(url, function(err, bd) {
  if (err) console.log(err);
  else{
      obGlobal.bdMongo = bd.db("phone_buddy");
  }
});

if (process.env.SITE_ONLINE) {
  obGlobal.protocol = "http://";
  obGlobal.numeDomeniu = "young-badlands-27908.herokuapp.com"
  var client = new Client({
    user: "yzwwchepmxctbu",
    password: "0dee359f180215ae7d511125a954388a407ff4b2db2ba72a31b9bb685a54b036",
    database: "dd3g6annr1nmqm",
    host: "ec2-52-203-118-49.compute-1.amazonaws.com",
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

else {
  obGlobal.protocol = "http://";
  obGlobal.numeDomeniu = "localhost:" + obGlobal.port;
  var client = new Client({
    user: "test_user",
    password: "15082002",
    database: "phone_buddy",
    host: "localhost",
    port: 5432
  });

}




function getIp(req) {//pentru Heroku
  var ip = req.headers["x-forwarded-for"];//ip-ul userului pentru care este forwardat mesajul
  if (ip) {
    let vect = ip.split(",");
    return vect[vect.length - 1];
  }
  else if (req.ip) {
    return req.ip;
  }
  else {
    return req.connection.remoteAddress;
  }
}


async function trimiteMail(email, subiect, mesajText, mesajHtml, atasamente = []) {
  var transp = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {//date login 
      user: obGlobal.emailServer,
      pass: "niqxwubxqimbcygl"
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  //genereaza html
  await transp.sendMail({
    from: obGlobal.emailServer,
    to: email,
    subject: subiect,//"Te-ai inregistrat cu succes",
    text: mesajText, //"Username-ul tau este "+username
    html: mesajHtml,// `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
    attachments: atasamente
  })
  console.log("trimis mail");
}

client.connect();

foldere = ["temp", "poze_uploadate"];
for (let folder of foldere) {
  let caleFolder = path.join(__dirname, folder);
  if (!fs.existsSync(caleFolder))
    fs.mkdirSync(caleFolder);
}

app = express();
app.use(helmet.frameguard());
app.use(["/produse_cos","/cumpara"],express.json({limit:'2mb'}));
app.use(["/mesaj"], express.json({limit: '2mb'}));
app.use(["/contact"], express.urlencoded({extended:true}));

const server = new http.createServer(app);  
var  io= socket(server)
io = io.listen(server);//asculta pe acelasi port ca si serverul

io.on("connection", function (socket)  {  
    console.log("Conectare!");
	//if(!conexiune_index)
	//	conexiune_index=socket
    socket.on('disconnect', function() {conexiune_index=null;console.log('Deconectare')});
});

app.use(session({  // se creeaza proprieteatea session a request-ului (putem folosi req.session)
  secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
  resave: true,
  saveUninitialized: false
}));

app.set("view engine", "ejs");


app.use("/Sources", express.static(__dirname + "/Sources"));
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));



client.query("select * from unnest(enum_range(null::categ_accesorii))", function (err, rezCateg) {
  obGlobal.optiuniMeniu = rezCateg.rows;
});

var ipuri_active={};


app.use("/*",function(req,res,next){
    let ipReq=getIp(req);
    let ip_gasit=ipuri_active[ipReq+"|"+req.url];
    timp_curent=new Date();
    if(ip_gasit){
        if( (timp_curent-ip_gasit.data)< 10*1000) {
            if (ip_gasit.nr>30){
                res.send("<h1>Too many requests in a short period of time! Please calm down and try again later!</h1>");
                ip_gasit.data=timp_curent
                return;
            }
            else if(ip_gasit.resursa == req.url){  
                ip_gasit.data=timp_curent;
                ip_gasit.nr++;
            }
        }
        else{
            ip_gasit.data=timp_curent;
            ip_gasit.nr=1;
            ip_gasit.resursa = req.url;
        }
    }
    else{
        ipuri_active[ipReq+"|"+req.url]={nr:1, data:timp_curent, resursa:req.url};
    }
    let comanda_param= `insert into accesari(ip, user_id, pagina) values ($1::text, $2,  $3::text)`;
    if (ipReq){
        var id_utiliz=req.session.utilizator?req.session.utilizator.id:null;
        client.query(comanda_param, [ipReq, id_utiliz, req.url], function(err, rez){
            if(err) console.log(err);
        });
    }
    next();   
}); 

app.use("/*", function (req, res, next) {
  res.locals.categorii = obGlobal.optiuniMeniu;
  res.locals.utilizator = req.session.utilizator;
  res.locals.mesajLogin = req.session.mesajLogin;
  req.session.mesajLogin = null;
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

app.get("/gallery", function (req, res) {
  nr_pos = [4, 9, 16]
  nrimag = nr_pos[Math.floor(Math.random() * nr_pos.length)];
  res.render('pagini/gallery', { imagini: obImagini.imagini, nrimag: nrimag });
})

app.get("*/galerie-animata.css", function (req, res) {
  var sirScss = fs.readFileSync(__dirname + "/Sources/sass/galerie_animata.scss").toString("utf8");
  var culoareAleatoare = nrimag;
  rezScss = ejs.render(sirScss, { nrimag: nrimag });
  var caleScss = __dirname + "/temp/galerie_animata.scss";
  fs.writeFileSync(caleScss, rezScss);

  try {
    rezCompilare = sass.compile(caleScss, { sourceMap: true });
    var caleCss = __dirname + "/temp/galerie_animata.css";
    fs.writeFileSync(caleCss, rezCompilare.css);
    res.setHeader("Content-Type", "text/css");
    res.sendFile(caleCss);
  }

  catch (err) {
    console.log(err);
    res.send("Eroare");
  }
})



function stergeAccesariVechi() {
  let queryDelete = `delete from accesari where now() - data_accesare > interval '24 hours'`;
  client.query(queryDelete, function (err, rezQuery) {
    if (err)
      console.log(err);
  });
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 60 * 60 * 1000);

app.get(["/", "/index", "/home"], function (req, res) {
  // res.sendFile(__dirname + "/index1.html");
  let querySelect = "select a.user_id, u.nume, u.prenume, u.username, max(a.data_accesare) as last_acc from accesari as a join utilizatori as u on u.id = a.user_id group by a.user_id, u.nume, u.prenume, u.username;";
  client.query(querySelect, function (err, rezQuery) {
    let utilizOnline = []
    if (err)
      console.log(err);
    else {
      utilizOnline = rezQuery.rows;
    }

    client.query("select * from accessories", function(err, rezSelect) {
      if(err)
        console.log(err)
      else{
        var evenimente=[]
        var locatie="";
        
        request('http://secure.geobytes.com/GetCityDetails?key=7c756203dbb38590a66e01a5a3e1ad96&fqcn=109.99.96.15', //se inlocuieste cu req.ip; se testeaza doar pe Heroku / 'https://secure.geobytes.com/GetCityDetails?key=7c756203dbb38590a66e01a5a3e1ad96&fqcn=109.99.96.15'
            function (error, response, body) {
            if(error) {console.error('error:', error)}
            else{
                var obiectLocatie=JSON.parse(body);
                locatie=obiectLocatie.geobytescountry+" "+obiectLocatie.geobytesregion
            }
            
            var dataCurenta = new Date();
            evenimente.push({data: new Date(dataCurenta.getFullYear(), 5, 16), text:"Phone Buddy Website Anniversary"});
            evenimente.push({data: new Date(dataCurenta.getFullYear(), 11, 26), text:"Boxing Day"});
            evenimente.push({data: new Date(dataCurenta.getFullYear(), dataCurenta.getMonth(), 15), text:"Maintainance Day"});
            res.render("pagini/index", { ip: getIp(req), imagini: obImagini.imagini, utilizOnline: utilizOnline, produse: rezSelect.rows, locatie: locatie, evenimente: evenimente});
        });
        
      }
        
    })
    
  });
})

app.get("/products", function (req, res) {
  client.query("select min(pret) from accessories", function (err, rezMinp) {
    client.query("select max(pret) from accessories", function (err, rezMaxp) {
      client.query("select distinct color from accessories", function (err, rezCulori) {
        if (req.query.type) {
          client.query("select * from accessories where categorie = $1", [req.query.type],function (err, rezQuery) {
            res.render("pagini/products", { produse: rezQuery.rows, culori: rezCulori.rows, maxPrice: rezMaxp.rows[0], minPrice: rezMinp.rows[0] });
          });
        }
        else {
          client.query("select * from accessories", function (err, rezQuery) {
            res.render("pagini/products", { produse: rezQuery.rows, culori: rezCulori.rows, maxPrice: rezMaxp.rows[0], minPrice: rezMinp.rows[0] });
          });
        }
        
      });

    })
  })
});

app.get("/product/:id", function (req, res) {
  client.query(`select * from accessories where id = $1`, [req.params.id],function (err, rezQuery) {
    if (err)
      console.log(err);
    else
      res.render("pagini/product", { prod: rezQuery.rows[0] });
  });
});

app.post("/produse_cos", function(req, res) {
  //console.log(req.body);
  if(req.body.ids_prod.length != 0) {
    var querySelect = `select id, nume, descriere, pret, discount, returnable, imagine from accessories where id in (${req.body.ids_prod.join(",")})`;
    client.query(querySelect, function(err, rezQuery) {
      if(err) {
        console.log(err);
        res.send("Database Error!");
      }
        
      res.send(rezQuery.rows);
    });
  }

  else {
    res.send([]);
  }
});

app.post("/cumpara",function(req, res){
  if(!req.session.utilizator){
      res.write("<h2>You have to log in before completing the order!</h2>");res.end();
      return;
  }
  //TO DO verificare id-uri pentru query-ul la baza de date
  client.query("select id, nume, pret, categorie, color, returnable, discount, imagine from accessories where id in ("+req.body.ids_prod+")", function(err,rez){
      //console.log(err, rez);
      //console.log(rez.rows);

      for(let i = 0; i < rez.rows.length; ++ i) {
        rez.rows[i].qtty = req.body.qttys_prod[i];
      }
      
      let rezFactura=ejs.render(fs.readFileSync("views/pagini/factura.ejs").toString("utf8"),{utilizator:req.session.utilizator,produse:rez.rows, protocol:obGlobal.protocol, domeniu:obGlobal.numeDomeniu});
      //console.log(rezFactura);
      let options = { format: 'A4', args: ['--no-sandbox', '--disable-extensions',  '--disable-setuid-sandbox'] };

      let file = { content: juice(rezFactura, {inlinePseudoElements:true}) };
     
      html_to_pdf.generatePdf(file, options).then(function(pdf) {
          if(!fs.existsSync("./temp"))
              fs.mkdirSync("./temp");
          var numefis="./temp/test"+(new Date()).getTime()+".pdf";
          fs.writeFileSync(numefis,pdf);
          let mText=`Dear ${req.session.utilizator.username}, thank you for ordering from our online store! We attached the bill to this email.`;
          let mHtml=`<h1>Hello there!</h1><p>${mText}</p>`;

          trimiteMail(req.session.utilizator.email,"Bill", mText, mHtml, [{ 
                                                  filename: 'Bill.pdf',
                                                  content: fs.readFileSync(numefis)
                                              }]);
          res.write("<h2>Order Placed Successfully!</h2>");res.end();
          let v_prod = [];
          for(let prod of rez.rows) {
            v_prod.push({nume: prod.nume, pret: prod.pret, cantitate: prod.qtty});
          }

          let factura= { data: new Date(), nume: req.session.utilizator.nume, prenume: req.session.utilizator.prenume, produse:v_prod};
          obGlobal.bdMongo.collection("facturi").insertOne(factura, function(err, res) {
              if (err) console.log(err);
              else{
                  console.log("Am inserat factura in mongodb");
                  //doar de debug:
                  obGlobal.bdMongo.collection("facturi").find({}).toArray(function(err, result) {
                      if (err) console.log(err);
                      else console.log(result);
                    });
              }
            });
      });
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////// Contact
caleXMLMesaje="Sources/xml/contact.xml";
headerXML=`<?xml version="1.0" encoding="utf-8"?>`;
function creeazaXMlContactDacaNuExista(){
    if (!fs.existsSync(caleXMLMesaje)){
        let initXML={
            "declaration":{
                "attributes":{
                    "version": "1.0",
                    "encoding": "utf-8"
                }
            },
            "elements": [
                {
                    "type": "element",
                    "name":"contact",
                    "elements": [
                        {
                            "type": "element",
                            "name":"mesaje",
                            "elements":[]                            
                        }
                    ]
                }
            ]
        }
        let sirXml=xmljs.js2xml(initXML,{compact:false, spaces:4});//obtin sirul xml (cu taguri)
        console.log(sirXml);
        fs.writeFileSync(caleXMLMesaje,sirXml);
        return false; //l-a creat
    }
    return true; //nu l-a creat acum
}


function parseazaMesaje(){
    let existaInainte=creeazaXMlContactDacaNuExista();
    let mesajeXml=[];
    let obJson;
    if (existaInainte){
        let sirXML=fs.readFileSync(caleXMLMesaje, 'utf8');
        obJson=xmljs.xml2js(sirXML,{compact:false, spaces:4});
        

        let elementMesaje=obJson.elements[0].elements.find(function(el){
                return el.name=="mesaje"
            });
        let vectElementeMesaj=elementMesaje.elements?elementMesaje.elements:[];// conditie ? val_true: val_false
        // console.log("Mesaje: ",obJson.elements[0].elements.find(function(el){
        //     return el.name=="mesaje"
        // }))
        let mesajeXml=vectElementeMesaj.filter(function(el){return el.name=="mesaj"});
        return [obJson, elementMesaje,mesajeXml];
    }
    return [obJson,[],[]];
}


app.get("/contact", function(req, res){
    let obJson, elementMesaje, mesajeXml;
    [obJson, elementMesaje, mesajeXml] =parseazaMesaje();

    res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:mesajeXml})
});

app.post("/contact", function(req, res){
    let obJson, elementMesaje, mesajeXml;
    [obJson, elementMesaje, mesajeXml] =parseazaMesaje();
        
    let u= req.session.utilizator?req.session.utilizator.username:"Anonymous User";
    let color = "white";
    if(req.session.utilizator && req.session.utilizator.rol == "admin")
      color = "red";
    
    if(req.body.mesaj == "") {
      res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:elementMesaje.elements})
      return;
    }

    let mesajNou={
        type:"element", 
        name:"mesaj", 
        attributes:{
            username:u, 
            data:new Date(),
            color: color
        },
        elements:[{type:"text", "text":req.body.mesaj}]
    };
    if(elementMesaje.elements)
        elementMesaje.elements.push(mesajNou);
    else 
        elementMesaje.elements=[mesajNou];
    let sirXml=xmljs.js2xml(obJson,{compact:false, spaces:4});
    fs.writeFileSync("Sources/xml/contact.xml",sirXml);
    
    res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:elementMesaje.elements})
});

/////////////////////////////////////////////////////////////////

app.get("/eroare", function (req, res) {
  randeazaEroare(res, 1, "Titlu Schimbat");
});


app.get('/chat', function(req, res) {
  if(!req.session.utilizator)
    randeazaEroare(res, 403);
  else
    res.render('pagini/chat', {port: s_port});
})

app.post("/mesaj", function(req, res) {
  console.log("primit mesaj");
  console.log(req.body);
  var mesaj = req.body.mesaj.replaceAll("<", "&lt;");
  mesaj = mesaj.replaceAll(">", "&gt;");
  io.sockets.emit("mesaj_nou", req.body.emoji, mesaj, req.session.utilizator.nume, req.session.utilizator.prenume, req.session.utilizator.culoare_chat);
  res.send("ok");
});

app.get("/admin_products", function(req, res) {
  if(req.session.utilizator && req.session.utilizator.rol == 'admin'){
    client.query("select * from accessories order by id", function(err, rezQuery) {
      res.render("pagini/admin_products", {produse : rezQuery.rows})
    })
  }
  else {
    randeazaEroare(res, 403);
  }
})

app.post("/sterge_produs", function(req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function(err, fields, files) {
    var caleImagine;
    client.query("select imagine from accessories where id = $1", [fields.id], function(err, rezSelect) {
      if(err)
        console.log(err);
      caleImagine = path.join(__dirname,"Sources", "pictures", "products", rezSelect.rows[0].imagine);
    });
    client.query("delete from accessories where id = $1", [fields.id], function(err, rezDelete) {
      if(!err) {
        client.query("select * from accessories order by id", function(err, rezQuery) {
          fs.unlink(caleImagine, function(err) { if(err) console.log(err)})
          res.render("pagini/admin_products", {produse : rezQuery.rows, raspuns: "Delete successful!"})
        })
      }
      else {
        client.query("select * from accessories order by id", function(err, rezQuery) {
          res.render("pagini/admin_products", {produse : rezQuery.rows, raspuns: "Delete failed!"})
          })
      }
      })
    })
  })



app.post("/insert_produs", function(req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function(err, fields, files) {
    let queryInsert = `insert into accessories(nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, color) 
    values($1::text, $2::text, $3, $4, $5::tipuri_produse, $6::categ_accesorii, $7, $8, $9, $10)`;
    client.query(queryInsert, [fields.pname, fields.pdesc, parseFloat(fields.pprice), parseInt(fields.pdisc), fields.ptype, fields.pcateg, fields.pmat, (fields.pret == 'on')? true : false, files.imagine.originalFilename, fields.pcol], function(err, rezInsert) {
      if(err) {
        console.log("EROARE: ", err);
        client.query("select * from accessories order by id", function(err, rezQuery) {
          res.render('pagini/admin_products', {produse : rezQuery.rows, raspuns: "Product insertion failed!"});
        })
      }
        
      else {
        client.query("select * from accessories order by id", function(err, rezQuery) {
          res.render('pagini/admin_products', {produse : rezQuery.rows, raspuns: "Product added!"});
        })
      }
    })
  })
  formular.on("fileBegin", function(nume, fisier) {
    fisier.filepath = path.join(__dirname, "Sources", "pictures", "products", fisier.originalFilename);
  });

  formular.on("file", function(nume, fisier) {});
})

app.post("/modifica_produs", function(req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function(err, fields, files) {
    console.log("Fields: ", fields)
    console.log("Files: ", files)


    let queryUpdate = "update accessories set (nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, color) = ($1::text, $2::text, $3, $4, $5::tipuri_produse, $6::categ_accesorii, $7, $8, $9::text) where id = $10";
    client.query(queryUpdate, [fields.m_pname, fields.m_pdesc, fields.m_pprice, fields.m_pdisc, fields.m_ptype, fields.m_pcateg, fields.m_pmat, (fields.m_pret)? true : false, fields.m_pcol, fields.id], function(err, rezUpdate) {
      if(err) {
        console.log("EROARE: ", err);
        client.query("select * from accessories order by id", function(err, rezQuery) {
          res.render('pagini/admin_products', {produse : rezQuery.rows, raspuns: "Product modification failed!"});
        })
      }

    });

    if(files.imagine.originalFilename) {
      queryUpdate = "update accessories set imagine = $1::text where id = $2";
      client.query(queryUpdate, [files.imagine.originalFilename, fields.id], function(err, rezUpdate) {
        if(err) {
          console.log("EROARE: ", err);
          client.query("select * from accessories order by id", function(err, rezQuery) {
            res.render('pagini/admin_products', {produse : rezQuery.rows, raspuns: "Product modification failed!"});
          })
        }
        else {
          client.query("select * from accessories order by id", function(err, rezQuery) {
            res.render('pagini/admin_products', {produse : rezQuery.rows, raspuns: "Product modified!"});
          })
        }
      })
    }

    else {
      client.query("select * from accessories order by id", function(err, rezQuery) {
        res.render('pagini/admin_products', {produse : rezQuery.rows, raspuns: "Product modified!"});
      })
    }
    
  });

  formular.on("fileBegin", function(nume, fisier) {
    if(fisier.originalFilename)
      fisier.filepath = path.join(__dirname, "Sources", "pictures", "products", fisier.originalFilename);
  });

  formular.on("file", function(nume, fisier) {});

});

// app.get("/about", function(req, res){
//   // res.sendFile(__dirname + "/index1.html");
//   res.render("pagini/about");
// })

//------------------------ utilizatori ---------------------------//

var intervaleAscii = [[48, 57], [65, 90], [97, 122]];
for (let interval of intervaleAscii) {
  for (let i = interval[0]; i <= interval[1]; ++i)
    obGlobal.sirAlphaNum += String.fromCharCode(i);
}

var sirAlpha = "";
for (let i = 1; i < 3; i++) {
  for (let j = intervaleAscii[i][0]; j <= intervaleAscii[i][1]; j++) {
    sirAlpha += String.fromCharCode(j);
  }
}

function genereazaToken(username) {
  var token = "";
  for (let i = 0; i < 4; ++i)
    token += sirAlpha[Math.floor(Math.random() * sirAlpha.length)];

  var tempRegExp;
  var endToken = crypto.scryptSync(username, obGlobal.numeDomeniu, 40).toString('hex').replace(/[^a-zA-Z0-9]/g, "0");
  token += endToken;
  return token;
}

parolaServer = "tehniciweb";
app.post("/inreg", function (req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    console.log("campuriText: ", campuriText);
    console.log("campuriFisiser: ", campuriFisier);
    var calePozaDefault = path.join("poze_uploadate", "__default", "default.png");

    var eroare = "";

    if (campuriText.username == "") {
      eroare += "Required \"Username\" field found empty. "
    }

    if (campuriText.prenume == "") {
      eroare += "Required \"First Name\" field found empty. "
    }

    if (campuriText.nume == "") {
      eroare += "Required \"Last Name\" field found empty. "
    }

    if (campuriText.parola == "") {
      eroare += "Required \"Password\" field found empty. "
    }

    if (campuriText.rparola == "") {
      eroare += "Required \"Confirm Password\" field found empty. "
    }

    if (campuriText.email == "") {
      eroare += "Required \"Email\" field found empty. "
    }

    if (!campuriText.username.match(new RegExp("^[A-Za-z0-9]+$"))) {
      eroare += "Username contains forbidden characters. "
    }

    if (!campuriText.nume.match(new RegExp("^[A-Za-z\s\-]+$"))) {
      eroare += "Last Name contains forbidden characters."
    }

    if (!campuriText.prenume.match(new RegExp("^[A-Za-z\s\-]+$"))) {
      eroare += "First Name contains forbidden characters."
    }

    if (campuriText.parola.length < 4) {
      eroare += "Password too short. "
    }

    if (!eroare) {
      queryUtiliz = `select username from utilizatori where username=$1::text`;
      client.query(queryUtiliz, [campuriText.username], function (err, rezUtiliz) {
        if (rezUtiliz.rows.length != 0) {
          eroare += "This Username is already taken. "
          res.render("pagini/inregistrare", { err: "Error: " + eroare });
        }
        else {
          var token = genereazaToken(campuriText.username);
          var parolaCriptata = crypto.scryptSync(campuriText.parola, parolaServer, 64).toString('hex');
          let calePoza = calePozaDefault;
          if (campuriFisier.poza.originalFilename)
            calePoza = path.join("poze_uploadate", campuriText.username, "poza." + campuriFisier.poza.originalFilename.split('.')[1]);
          var comandaInserare = `insert into utilizatori (username, nume, prenume, parola, email, culoare_chat, cod, ocupatie, cale_imagine) values ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, $9::text)`;
          client.query(comandaInserare, [campuriText.username, campuriText.nume, campuriText.prenume, parolaCriptata, campuriText.email, campuriText.culoare_chat, token, campuriText.ocupatie, calePoza], function (err, rezInserare) {
            if (err) {
              console.log(err);
              res.render("pagini/inregistrare", { err: "Database error!" + err });
            }
            else
              res.render("pagini/inregistrare", { raspuns: "Details have been saved." });
            let linkConfrimare = `${obGlobal.protocol}${obGlobal.numeDomeniu}/confirmare/${campuriText.username}/${token}`;
            trimiteMail(campuriText.email, "New account", `Welcome to Phone Buddy online community!\nYour username is ${campuriText.username}`, `<h1>Welcome to Phone Buddy online community!</h1><p>Your username is <span style="color:green; font-weight:bold;">${campuriText.username}</span>.</p><p> Click here to confirm your account: <a href="${linkConfrimare}">${linkConfrimare}</a></p>`)
          });

        }
      });
    }

    else {
      res.render("pagini/inregistrare", { err: "Error: " + eroare });
    }
  });
  var username;
  formular.on("field", function (nume, val) {  // 1
    if (nume == "username")
      username = val;
  })


  formular.on("fileBegin", function (nume, fisier) { //2
    var okPoza = fisier.originalFilename.split(".").length == 2 && obGlobal.extensiiPoze.includes(fisier.originalFilename.split(".")[1]);

    if(username.includes("../") || (fisier && fisier.originalFilename && !okPoza)) {
      console.log("Incercare de hackereala blocata!");
      res.render("pagini/inregistrare", {err: "Forbidden file extension or username!"})
    }
    else {
        var caleUtiliz = path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(caleUtiliz))
          fs.mkdirSync(caleUtiliz);
        fisier.filepath = path.join(caleUtiliz, "poza." + fisier.originalFilename.split('.')[1]);
    }

  });

  formular.on("file", function (nume, fisier) {//3

  });

})

app.get("/confirmare/:username/:token", function (req, res) {
  console.log("into /confirm", req.params.username, req.params.token);
  var comandaSelect = `update utilizatori set confirmat_mail = true where username = $1::text and cod = $2::text`;
  client.query(comandaSelect, [req.params.username, req.params.token], function (err, rezUpdate) {
    if (err) {
      console.log(err);
      randeazaEroare(res, 2);
    }
    else {
      if (rezUpdate.rowCount == 1) {
        res.render("pagini/confirmare");
      }
      else {
        randeazaEroare(res, 2, "Confirm link error", "Username or link not correct");
      }
    }
  });
})

app.post("/login", function (req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    var parolaCriptata = crypto.scryptSync(campuriText.parola_login, parolaServer, 64).toString('hex');
    // var querySelect = `select * from utilizatori where username='${campuriText.username}' and parola='${parolaCriptata}' and confirmat_mail = true`;
    var querySelect = `select * from utilizatori where username=$1::text and parola=$2::text`;
    client.query(querySelect, [campuriText.username, parolaCriptata], function (err, rezSelect) {
      if (err)
        console.log(err);
      else {
        if (rezSelect.rows.length == 1) {
          if (rezSelect.rows[0].confirmat_mail) {
            req.session.utilizator = {
              id: rezSelect.rows[0].id,
              nume: rezSelect.rows[0].nume,
              prenume: rezSelect.rows[0].prenume,
              username: rezSelect.rows[0].username,
              email: rezSelect.rows[0].email,
              culoare_chat: rezSelect.rows[0].culoare_chat,
              rol: rezSelect.rows[0].rol,
              cale_imagine: rezSelect.rows[0].cale_imagine,
              ocupatie: rezSelect.rows[0].ocupatie,
            }

            res.redirect("/index");
          }
          else {
            req.session.mesajLogin = "Failed Login!\nEmail not confirmed!"
            res.redirect("/index")
          }
        }
        else {
          // res.send("nu e bine");
          req.session.mesajLogin = "Failed Login!"
          res.redirect("/index")
        }
      }
    })
  });

});

app.get("/useri", function (req, res) {
  if (req.session.utilizator && req.session.utilizator.rol == "admin") {
    client.query("select * from utilizatori where rol = 'comun'", function (err, rezQuery) {
      res.render("pagini/useri", { useri: rezQuery.rows });
    });
  }
  else {
    randeazaEroare(res, 403);
  }
});

app.post("/sterge_cont", function (req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    console.log(campuriText);
    var parolaCriptata = crypto.scryptSync(campuriText.parl_del, parolaServer, 64).toString('hex');
    console.log(parolaCriptata);
    var queryDelete = 'delete from utilizatori where id = $1 and parola = $2::text';
    client.query(queryDelete, [campuriText.id_del, parolaCriptata], function (err, rezDelete) {
      if (!err) {
        trimiteMail(campuriText.email_del, "You deleted your account!", `Dear ${req.session.utilizator.username}, we are sorry that you deleted your account.\nGoodbye!\nPhone Buddy co.`, `<p>Dear ${req.session.utilizator.username}, We are sorry that you <span style="color:red;">deleted</span> your account.</p><p>Goodbye!</p><p>Phone Buddy co.</p>`);
        req.session.destroy();
        res.locals.utilizator = null;
        res.render("pagini/delete_account", { result: true });
      }
      else {
        res.render("pagini/delete_account", { result: false });
        console.log(err);
      }
    })
  })
})

app.post('/sterge_utiliz', function (req, res) {
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    let querySelectEmail = "select email from utilizatori where id = $1";
    client.query(querySelectEmail, [campuriText.id_utiliz], function (err, rezSelect) {
      let queryDel = `delete from utilizatori where id = $1`;
      client.query(queryDel, [campuriText.id_utiliz], function (err, rezQuery) {
        console.log(err);
        // TO DO afisare friendly pentru cazurile de succes si esec
        var rezultat = "User deleted successfully!";
        if (err)
          rezultat = "Error while trying to delete user account!" + err;
        else {
          trimiteMail(rezSelect.rows[0].email, "Your account has been deleted!", "We are so sorry to inform you, but your account has been DELETED by an Administrator! Goodbye!\n Phone Buddy co.", '<p>We are so sorry to inform you, but your account has been <span style="color:red;">DELETED</span> by an <span style="color:darkblue;">Administrator</span>!</p> <p>Phone Buddy co.</p>');
        }
        let querySelectUseri = "select * from utilizatori where rol='comun'";
        client.query(querySelectUseri, function (err, rezUseri) {
          res.render("pagini/useri", { result: rezultat, useri: rezUseri.rows });
        })
      })
    })

  })
});

// ---------------- Update profil -----------------------------

app.post("/profil", function (req, res) {
  if (!req.session.utilizator) {
    res.render("pagini/eroare_generala", { text: "You are not logged in!" });
    return;
  }
  var formular = new formidable.IncomingForm();

  formular.parse(req, function (err, campuriText, campuriFile) {

    console.log("campuriText: ", campuriText);
    console.log("campuriFile: ", campuriFile);
    // if (!campuriText.parola) {
    //   res.redirect("/index");
    // }
    var criptareParola = crypto.scryptSync(campuriText.parola, parolaServer, 64).toString('hex');
    var parolaNouaCriptata = criptareParola;
    if (campuriText.rparola)
      parolaNouaCriptata = crypto.scryptSync(campuriText.rparola, parolaServer, 64).toString('hex');

    var caleImagineNoua = req.session.utilizator.cale_imagine;

    if (campuriFile.poza.originalFilename)
      caleImagineNoua = path.join('poze_uploadate', campuriText.username, "poza." + campuriFile.poza.originalFilename.split('.')[1]);

    //query update
    var queryUpdate = `update utilizatori set nume = $1::text, prenume = $2::text, email = $3::text, culoare_chat = $4::text, ocupatie = $6::text, parola = $7::text, cale_imagine = $8::text where parola = $5::text`;

    client.query(queryUpdate, [campuriText.nume, campuriText.prenume, campuriText.email, campuriText.culoare_chat, criptareParola, campuriText.ocupatie, parolaNouaCriptata, caleImagineNoua], function (err, rez) {
      if (err) {
        console.log(err);
        res.render("pagini/eroare_generala", { text: "Database error. Please try again later." });
      }
      if (rez.rowCount == 0) {
        res.render("pagini/profil", { raspuns: "failed" });
      }
      else {
        //actualizare sesiune
        req.session.utilizator.nume = campuriText.nume;
        req.session.utilizator.prenume = campuriText.prenume;
        req.session.utilizator.email = campuriText.email;
        req.session.utilizator.culoare_chat = campuriText.culoare_chat;
        req.session.utilizator.ocupatie = campuriText.ocupatie;
        req.session.utilizator.cale_imagine = caleImagineNoua;
        res.render("pagini/profil", { raspuns: "succes" });
        trimiteMail(req.session.utilizator.email, "Update Account Details", `You updated your account.\nThe details about your account are the following:\n1.First Name: ${campuriText.prenume}\n2.Last Name: ${campuriText.nume}\n3.Chat Color: ${campuriText.culoare_chat}\n4.Occupation: ${campuriText.ocupatie}\n\nPhone Buddy co.`, 
        `<p>You updated your account.</p><p>The details about your account are the following:</p><ol><li>First Name: ${campuriText.prenume}</li><li>Last Name: ${campuriText.nume}</li><li>Chat Color: ${campuriText.culoare_chat}</li><li>Occupation: ${campuriText.ocupatie}</li></ol><br><p>Phone Buddy co.</p>`);
      }

    });

  });

  var username;
  formular.on("field", function (nume, val) {  // 1
    if (nume == "username")
      username = val;
  })
  formular.on("fileBegin", function (nume, fisier) { //2
    var caleUtiliz = path.join(__dirname, "poze_uploadate", username);
    fs.readdir(caleUtiliz, function(err, files) {
      if(err)
        console.log(err);
      for(let file of files) {
        if(file.startsWith("poza")) {
          fs.unlink(path.join(caleUtiliz + file), function(err) {
            if(err)
              console.log(err);
          })
          break;
        }
      }
    })
    fisier.filepath = path.join(caleUtiliz, "poza." + fisier.originalFilename.split('.')[1]);
  })

  formular.on("file", function (nume, fisier) {//3

  });
});

app.get("/logout", function (req, res) {
  req.session.destroy();
  res.locals.utilizator = null;
  res.redirect("/index");
});

app.get("/*.ejs", function (req, res) {
  // res.sendFile(__dirname + "/index1.html");
  randeazaEroare(res, 403);
})

app.get("/factura", function(req, res) {
  client.query("select id, nume, pret, categorie, color, returnable, discount, imagine from accessories where id in ("+"2,5,4,10,11"+")", function(err,rez){
    res.render("pagini/factura", {utilizator:req.session.utilizator,produse:rez.rows, protocol:obGlobal.protocol, domeniu:obGlobal.numeDomeniu});
  })
})

app.get("/facturi", function(req, res) {
  if(!req.session.utilizator || !(req.session.utilizator.rol == "admin"))
    randeazaEroare(res, 403);
    obGlobal.bdMongo.collection("facturi").find({}).toArray(function(err, result) {
    if(err) console.log(err);
    else {
      
      facturi = result.sort(function(a, b) {
      if(a.data != b.data)
        return a.data.getTime() - b.data.getTime();
      else if(b.nume.localeCompare(a.nume) != 0)
        return b.nume.localeCompare(a.nume);
      else 
        return b.prenume.localeCompare(a.prenume);
      });
      console.log("FACTURI: ", facturi);
      res.render("pagini/facturi", {facturi: facturi});
    }
  });
  
})

app.get("/*", function (req, res) {
  console.log("generala: ", req.url);
  res.render("pagini" + req.url, { imagini: obImagini.imagini }, function (err, resRender) {
    if (err) {
      console.log(err.message);
      if (err.message.includes("Failed to lookup view")) {
        console.log(err);
        randeazaEroare(res, 404);
      }
      else {
        console.log(err)
        res.send("Error");
      }
    }
    else {
      res.send(resRender);
    }
  });

  res.end();
})

function creeazaImagini() {
  var buf = fs.readFileSync(__dirname + "/Sources/json/galerie.json").toString("utf8");
  obImagini = JSON.parse(buf);//global
  //console.log(obImagini);

  for (let imag of obImagini.imagini) {
    let nume_imag, extensie;
    [nume_imag, extensie] = imag.cale_fisier.split(".");// "abc.de".split(".") ---> ["abc","de"]
    let dim_mic = 150;

    imag.mic = `${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
    //console.log(imag.mic);

    imag.mare = `${obImagini.cale_galerie}/${imag.cale_fisier}`;
    if (!fs.existsSync(imag.mic))
      sharp(__dirname + "/" + imag.mare).resize(dim_mic).toFile(__dirname + "/" + imag.mic);


    let dim_mediu = 300
    imag.mediu = `${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png`
    if (!fs.existsSync(imag.mediu))
      sharp(__dirname + "/" + imag.mare).resize(dim_mediu).toFile(__dirname + "/" + imag.mediu);
  }

}
creeazaImagini();

function creeazaErori() {
  var buf = fs.readFileSync(__dirname + "/Sources/json/erori.json").toString("utf8");
  obErori = JSON.parse(buf);
}

creeazaErori();

function randeazaEroare(res, identificator, titlu, text, imagine) {

  var eroare = obErori.erori.find(function (elem) { return identificator == elem.identificator });
  titlu = titlu || (eroare && eroare.titlu) || "Eroare - eroare";
  text = text || (eroare && eroare.text) || "Paragraf eroare";
  imagine = imagine || (eroare && obErori.cale_baza + "/" + eroare.imagine) || "Sources/pictures/erori/interzis.png";


  if (eroare && eroare.status)
    res.status(eroare.identificator).render("pagini/eroare_generala", { titlu: eroare.titlu, text: eroare.text, imagine: obErori.cale_baza + "/" + eroare.imagine });
  else {
    res.render("pagini/eroare_generala", { titlu: titlu, text: text, imagine: imagine });
  }
}

cale_qr="./Sources/pictures/qrcode";
if (fs.existsSync(cale_qr))
  fs.rmSync(cale_qr, {force:true, recursive:true});
fs.mkdirSync(cale_qr);
client.query("select id from accessories", function(err, rez){
    for(let prod of rez.rows){
        let cale_prod=obGlobal.protocol+obGlobal.numeDomeniu+"/product/"+prod.id;
        //console.log(cale_prod);
        QRCode.toFile(cale_qr+"/"+prod.id+".png",cale_prod);
    }

    QRCode.toFile(cale_qr + "/products.png", obGlobal.protocol+obGlobal.numeDomeniu+"/products");
});

// app.listen(8080);
var s_port = process.env.PORT || obGlobal.port;
server.listen(s_port);
console.log("A pornit!!!");