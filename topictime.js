
// used by ready, changeNumTopics in processing
function createTimeSVGs () {
    var tsPage = d3.select("#ts-page");
    // Restart the visualizations
    tsPage.select("svg").remove();
    topicTimeGroups = [];
    
    var tsSVG = tsPage.append("svg").attr("height", timeSeriesHeight * numTopics).attr("width", timeSeriesWidth);
  
    for (var topic = 0; topic < numTopics; topic++) {
      topicTimeGroups.push(tsSVG.append("g").attr("transform", "translate(0," + (timeSeriesHeight * topic) + ")"));
      topicTimeGroups[topic].append("path").style("fill", "#ccc").style("stroke", "#fff");
      topicTimeGroups[topic].append("text").attr("y", 40);
    }
  
  }
// used by sweeep in sweep, changeNumTopics in processing
function timeSeries() {
    var tsPage = d3.select("#ts-page");
  
    for (var topic = 0; topic < numTopics; topic++) {
      var topicProportions = documents.map(function (d) { return {date: d.date, p: d.topicCounts[topic] / d.tokens.length}; })
      var topicMeans = d3.nest().key(function (d) {return d.date; }).rollup(function (d) {return d3.mean(d, function (x) {return x.p}); }).entries(topicProportions);
  
      var xScale = d3.scaleLinear().domain([0, topicMeans.length]).range([0, timeSeriesWidth]);
      var yScale = d3.scaleLinear().domain([0, 0.2]).range([timeSeriesHeight, 0]);
      var area = d3.area()
      .x(function (d, i) { return xScale(i); })
      .y1(function (d) { return yScale(d.value); })
      .y0(yScale(0));
  
      topicTimeGroups[topic].select("path").attr("d", area(topicMeans));
      topicTimeGroups[topic].select("text").text(topNWords(topicWordCounts[topic], 3))
    }
  
  }