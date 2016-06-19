var express = require('express')
var Promise = require('bluebird');
var rp = require("request-promise")

var app = express();

app.use(express.static('views'));
app.engine('html', require('ejs').renderFile);
var port = process.env.PORT || 8888;

source = {
    url : function(from, to, fromDate) {
      return `http://www.decolar.com/shop/flights/data/search/oneway/${from}/${to}/${fromDate}/1/0/0/FARE/ASCENDING/NA/NA/NA/NA?itemType=SINGLETYPE&pageSize=1000&tripType=MULTIPLEONEWAY&resultsInstanceIndex=1`
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
      var params = req.params;  
      var accepts = req.accepts(['html', 'json']);
      if (accepts == "html") {
        res.render('index.html');
      } else {
        var urls = [rp(source.url(params.from, params.to, params.fromDate)), rp(source.url(params.to, params.from, params.toDate))];
        Promise.all(urls).then(function (data) {
          var responses = data.map(function (elm) {
            return JSON.parse(elm)
          })
          var from = responses.filter(function(elm) {
            return elm.result.data.items[0].itinerary.locations[0].departure.city.code == params.from.toUpperCase()
          })
          var to = responses.filter(function(elm){
            return elm.result.data.items[0].itinerary.locations[0].departure.city.code == params.to.toUpperCase()
          })
          res.send({
            from : source.extractAndMap(from[0]),
            to : source.extractAndMap(to[0])
          })
         });
      }      
});

app.listen(port, function (err) {
  if (err) {
    console.error(err)
  }
  console.log('Example app listening on port!' + port);
});
