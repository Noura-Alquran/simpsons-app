'use strict'
// Application Dependencies
const express = require('express');
const pg = require('pg');
const methodOverride = require('method-override');
const superagent = require('superagent');
const cors = require('cors');

// Environment variables
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({extended:true}));
// Specify a directory for static resources
app.use(express.static('./public'));
// define our method-override reference
app.use(methodOverride('_method'));
// Set the view engine for server-side templating
app.set("view engine","ejs");
// Use app cors
app.use(cors());

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);

// app routes here
// -- WRITE YOUR ROUTES HERE --
app.get('/' ,getTenQuotes);
app.post('/saved',saveFavorite);
app.get('/favorite-quotes',renderSavedQuotes);
app.get('/favorite-quotes/:quote_id',renderDetails);
app.put('/favorite-quotes/:quote_id',updatehandling);
app.delete('/favorite-quotes/:quote_id',deletehandling)
// callback functions
// -- WRITE YOUR CALLBACK FUNCTIONS FOR THE ROUTES HERE --
function getTenQuotes(req,res){
    const url='https://thesimpsonsquoteapi.glitch.me/quotes?count=10';
    superagent.get(url).set('User-Agent', '1.0').then((results)=>{
        console.log(results.body);
        const arr=results.body.map((element)=>{
            new Quotes(element)
        })
        res.render('pages/index',{results: results.body})
    }).catch(error=>console.log(error))
}

function saveFavorite(req,res){
    console.log(req.body);
    const{quote,character,image,characterDirection}=req.body;
    const sql='INSERT INTO simpsons (quote,character,image,characterDirection,source)VALUES ($1,$2,$3,$4,$5);';
    const safeValues=[quote,character,image,characterDirection,"api"];
    client.query(sql,safeValues).then(results=>{
        console.log(results.rows);
        res.redirect('/favorite-quotes');
    }).catch(error=>console.log(error))
}

function renderSavedQuotes(req,res){
    const sql="SELECT * FROM simpsons WHERE source=$1;";
    const safeValue=["api"];
    client.query(sql,safeValue).then(results=>{
        res.render('pages/savedqu',{results : results.rows});
    }).catch(error=>console.log(error))
}
function Quotes(data){
    this.quote =data.quote;
    this.character=data.character;
    this.image=data.image
   this.characterDirection=data.characterDirection;
}
function renderDetails(req,res){
const quoteId=req.params.id;
const sql="SELECT * FROM simpsons WHERE id=$1;";
const safevalue=[quoteId];
client.query(sql,safevalue).then(results=>{
    res.render('pages/details' ,{results:results.rows[0]});
}).catch(error=>console.log(error))

}
function updatehandling(req,res){
    const quoteId=req.params.id;
    const{quote,character,image,characterDirection}=req.body;
    const sql="UPDATE simpsons SET quote=$1, character=$2,image=$3,characterDirection=$4,source=$5 WHERE id=$6;";
    const safevalue=[quoteId];
    client.query(sql,safevalue).then(results=>{
        res.redirect(`/favorite-quotes/${quoteId}`);
    }).catch(error=>console.log(error))
}
function deletehandling(req,res){
    const quoteId=req.params.id;
    const sql="DELETE FROM simpsons WHERE id=$1;";
    const safevalue=[quoteId];
    client.query(sql,safevalue).then(results=>{
        res.redirect('/favorite-quotes');
    }).catch(error=>console.log(error))

}
// helper functions

// app start point
client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);
