var topicTimeGroups; // used in createTimeSVGs
// Constants for metadata correlation views.
var timeSeriesWidth = 500; // used in createTimeSVGs, timeSeries
var timeSeriesHeight = 75; // used in createTimeSVGs, timeSeries
numTopics // in processvars (used by createTimeSVGs, timeSeries)
documents // in processvars (used by timeSeries)
topicWordCounts // in processvars (used by timeSeries)
var topNWords = function(wordCounts, n) { return wordCounts.slice(0,n).map( function(d) { return d.word; }).join(" "); }; // Used in timeSeries

// used by createTimeSVGs, timeSeries
d3.select("#ts-tab").on("click", function() {
    d3.selectAll(".page").style("display", "none");
    d3.selectAll("ul li").attr("class", "");
    d3.select("#ts-page").style("display", "block");
    d3.select("#ts-tab").attr("class", "selected");
  });