var express = require('express')
var Promise = require('bluebird');
var rp = require("request-promise")

var app = express();

app.use(express.static('views'));
app.engine('html', require('ejs').renderFile);
var port = process.env.PORT || 8888;

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

source = {
    url : function(from, to, fromDate, proxy) {
      var baseUrl = `http://www.decolar.com/shop/flights/data/search/oneway/${from}/${to}/${fromDate}/1/0/0/FARE/ASCENDING/NA/NA/NA/NA?itemType=SINGLETYPE&pageSize=1000&tripType=MULTIPLEONEWAY&resultsInstanceIndex=1`
      return {
        url : baseUrl,
        proxy: proxy,
        timeout: 3000//proxies[randomInt(0, proxies.length)]
      }
    },
    extractAndMap : function (json) {
      var items = json.result.data.items;
      return items.map(function (element) {
        var routes = element.itinerary.routes;
        return {
          provider : element.provider,
          price : element.emissionPrice.adult.baseFare.raw,
          time : routes.map(function (routeElement) {
            return {
              totalDuration : routeElement.totalDuration.formatted,
              departure : routeElement.departureDateTime,
              arrival : routeElement.departureDateTime,
            }
          })
        }
      })
    }
}

app.get('/:from/:fromDate/:to/:toDate', function (req, res) {      
  res.render('index.html');
});

app.get('/:from/:fromDate/:to/:toDate/voo.json', function (req, res) {      
      var params = req.params;  
      var urls = [rp(source.url(params.from, params.to, params.fromDate)), rp(source.url(params.to, params.from, params.toDate))];
      Promise.all(urls).then(function (data) {
        var responses = data.map(function (elm) {
          return JSON.parse(elm)
        })
        var from = responses.find(function(elm) {
          return elm.result.data.items[0].itinerary.locations[0].departure.city.code == params.from.toUpperCase()
        })
        var to = responses.find(function(elm){
          return elm.result.data.items[0].itinerary.locations[0].departure.city.code == params.to.toUpperCase()
        })
        res.send({
          from : source.extractAndMap(from),
          to : source.extractAndMap(to)
        })
      });        
});
 

var gproxies = []
require('proxy-lists')
  .getProxies({ countries: ['br'] })
  .on('data', function(proxies) {
    gproxies = gproxies.concat(proxies)
  })
  .once('end', function () {
    var prq = gproxies.map(function (element) {
      return "" + element.protocols[0] + '://' + element.ipAddress + ":" + element.port + "/" 
    }).map(function (proxy) {
      return rp(source.url("poa", "rio", "2016-10-11", proxy))
    })

    console.log("AEEEEEEEEEEEEEE")
    console.log(gproxies.length)
    Promise.some(prq, 1).then(function (data) {
      console.log("DAta")
      console.log(data)
    }).catch(Promise.AggregateError, function(err) {
        err.forEach(function(e) {
            //console.error(e.stack);
        });
    });   


  })
  .on('error', function(error) {
    console.error("error parsing" , error)
  });




  // app.listen(port, function (err) {
  //     console.log("Starting app")
  //     if (err) {
  //       console.error(err)
  //     }
  //     console.log('Example app listening on port!' + port);
  //   });