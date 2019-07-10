/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var mongoose = require('mongoose'); 
var axios = require("axios");
const request = require('request');
mongoose.Promise = global.Promise;
  

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

var stockdataSchema  = mongoose.Schema({
          stock: String, 
          IpAddress: [String],
          likes: {type:Number, default: 0}
})



       
var stockCollection = mongoose.model("stockCollection", stockdataSchema)

module.exports = function (app) {
 
  app.get('/api/stock-prices', function(req, res){
    
    //const params = new URLSearchParams(location.search)
    //console.log(params.getAll('stock'))
    const stock  = req.query.stock
    console.log(typeof(stock))
    
    //var stock1 = req.query.stock
    var like = req.query.like
  
    console.log(like)
    
    
    if(typeof(stock)== "object") {
        
      axios.get('https://api.iextrading.com/1.0/tops/last?symbols=' + stock[0] + "," + stock[1])
            .then(response => {
        
        
        if(stock[0] && stock[1] && (!like || like == "true")){
           stockCollection.find({"$or":[{stock: stock[0].toUpperCase()}, {stock: stock[1].toUpperCase()}]}, function(err, data){
          if(err){
            throw err
          }
          if(data.length === 2){
            res.send({stockData:[{stock:response.data[0].symbol, price: response.data[0].price, rel_likes: data[0].likes - data[1].likes},
                                {stock:response.data[1].symbol, price: response.data[1].price, rel_likes: data[1].likes - data[0].likes}]})
          }
        })
        }
        
        
       
                  //res.send(response.data)
      })
            .catch(error => {  
            console.log(error);
            });
       }
    
    
   
    if(typeof(stock)=="string" && like){
      console.log(req.ip)
    //axios starts
    axios.get('https://api.iextrading.com/1.0/tops/last?symbols=' + stock)     
    .then(response => {
        
      stockCollection.findOne({stock: stock.toUpperCase()}, function(err,data){
        if(err){
          throw err
        }
        if(data){
          console.log(data)
          if(like == 'true'){
            if(data.IpAddress.indexOf(req.ip)!==-1){
             return  res.send({stockData:{stock: response.data[0].symbol,
                                   price: response.data[0].price,
                                   likes: data.IpAddress.length}})
               }
              else{
                  data.IpAddress.push(req.ip)
                  data.likes = data.IpAddress.length
                   data.save((err, data)=>{
                    if(err){
                      throw err
                  } 
                  else if(data){
                    
                 return res.send({stockData:{stock: stock.toUpperCase(),
                                   price: response.data[0].price,
                                   likes: data.IpAddress.length}})
                }
              })
              } 
          }
          
         else  if(like == "false"){   
            if(data.IpAddress.includes(req.ip)) {
              
               data.IpAddress = data.IpAddress.filter((ip)=>{
                 return ip !== req.ip   
               })  
            
              data.likes = data.IpAddress.length
              data.save((err, data)=>{
                if(err){
                  throw err
                }
                else{
                 return res.send({stockData:{stock: response.data[0].symbol,
                                   price: response.data[0].price,
                                   likes: data.IpAddress.length}})
                }
              })
               }
            else if(!data.IpAddress.includes(req.ip)){
              console.log('me')
            return  res.send({stockData:{stock: response.data[0].symbol,
                                   price: response.data[0].price,
                                   likes: data.IpAddress.length}})
            }          
          }
        }
      })
      
      })
    .catch(error => {
        console.log(error);
    });
    //axios ends      
    }
    //no likes input only stock 1 or stock1 and like = false
    if((typeof(stock)=="string" && !like)  || (stock && like=="false")){
      //console.log('yes me')
      axios.get('https://api.iextrading.com/1.0/tops/last?symbols=' + stock) 
      .then(response => {
        stockCollection.findOne({stock: stock.toUpperCase()}, function(err, data){
          if(err){
            throw err
          }
          else if(data){
            console.log('yes me')
          return  res.send({stockData: {stock: response.data[0].symbol,
                                 price: response.data[0].price,
                                 likes: data.IpAddress.length}})
          }
          else{
            var myIpArr = []
            var mystock = new stockCollection({
              stock: stock.toUpperCase(),
              IpAddress:myIpArr,
              likes: myIpArr.length
            })
            
            mystock.save(function(err,data){
              if(err){
                throw err
              }  
              else{ 
               return res.send({stockData:{stock: response.data[0].symbol,
                                    price: response.data[0].price,
                                    likes: data.IpAddress.length}})
              }
            })
          }
        })
        
        
      })
      .catch(error => {
        console.log(error);
    });
    }
    if(typeof(stock) && like == "true"){
      axios.get('https://api.iextrading.com/1.0/tops/last?symbols=' + stock)
      .then(response => {
        
        stockCollection.findOne({stock: stock.toUpperCase()}, function(err, data){
          if(err){
            throw err 
          }
          else if(data && data.IpAddress.includes(req.ip)){
            console.log(data)
            return res.send({stockData:{stock: stock.toUpperCase(),
                                    price: response.data[0].price,
                                    likes: data.IpAddress.length }})
          }    
           else{  
            var myIpArr = [] 
            var mystock = new stockCollection({
              stock: stock.toUpperCase(),   
              IpAddress :myIpArr.push(req.ip),
              likes: 1
            })
            
            mystock.save(function(err,data){   
              if(err){
                throw err
              }     
              else{ 

               return res.send({stockData:{stock: stock.toUpperCase(),
                                    price: response.data[0].price,
                                    likes: data.IpAddress.length
                                    }})  
              }
            })
           }  
        })
      })
      .catch(error => {
        console.log(error);
    });
    }
    
  })
}