var d3Setup = function () {

  var winwidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var margin = {top: 20, right: 50, bottom: 30, left: 40},
  width = winwidth - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  this.d3model = function (parent) {
    var svg = d3.select(parent).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select(parent).append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    var xValue = function(d) { return d.time;}, // data -> value
          xScale = d3.scale.linear().range([0, width]), // value -> display
          xMap = function(d) { return xScale(xValue(d));}, // data -> display
          xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    var yValue = function(d) { return d.price;}, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> 
        yMap = function(d) { return yScale(yValue(d));}, // 
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    var cValue = function(d) { return d.provider;},
        color = d3.scale.category10();

    return {
      svg: svg,
      tooltip: tooltip,
      xValue: xValue,
      xScale: xScale,
      xMap: xMap,
      xAxis: xAxis,
      yValue: yValue,
      yScale: yScale,
      yMap: yMap,
      yAxis: yAxis,
      cValue: cValue,
      color: color
    }
  }
 

  d3.json("voo.json", function(error, flights) {

    var mapByCategory = function (data, category) {
      return data[category].map(function (element) {
        var time = element.time[0].departure.formatted.time.split(":")
        return {
            provider : element.provider,
            price : element.price,
            time : parseInt(time[0]) + (parseFloat(time[1]) / 60) 
        }
      })
    }

    var dataByCategory = {
      from: {
        data: mapByCategory(flights, "from"),
        model: d3model("#from")
      },
      to: {
        data: mapByCategory(flights, "to"),
        model: d3model("#to")
      }
    }

    Object.keys(dataByCategory).forEach(function (element) {
      var model = dataByCategory[element].model
      var data = dataByCategory[element].data

      model.xScale.domain([d3.min(data, model.xValue)-1, d3.max(data, model.xValue)+1]);
      model.yScale.domain([d3.min(data, model.yValue)-1, d3.max(data, model.yValue)+1]);

      // x-axis
      model.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(model.xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text("Horario");

      // y-axis
      model.svg.append("g")
          .attr("class", "y axis")
          .call(model.yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Preço");

      // draw dots
      model.svg.selectAll(".dot")
          .data(data)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", model.xMap)
          .attr("cy", model.yMap)
          .style("fill", function(d) { return model.color(model.cValue(d));})
          .on("mouseover", function(d) {
              model.tooltip.transition()
                   .duration(200)
                   .style("opacity", .9);
              model.tooltip.html(JSON.stringify(d) + "<br/> (" + model.xValue(d)
              + ", " + model.yValue(d) + ")")
                   .style("left", (d3.event.pageX + 5) + "px")
                   .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
              model.tooltip.transition()
                   .duration(500)
                   .style("opacity", 0);
          });

      // draw legend
      var legend = model.svg.selectAll(".legend")
          .data(model.color.domain())
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      // draw legend colored rectangles
      legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", model.color);

      // draw legend text
      legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d;})
    })

  });
}


d3Setup()