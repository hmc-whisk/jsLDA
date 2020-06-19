numTopics // // in processvars (used by getTopicCorrelations, getCorrelationGraph, plotMatrix)
documents // in processvars (used by getTopicCorrelations
// Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
var correlationMinTokens = 2; // used by getTopicCorrelations
var correlationMinProportion = 0.05; // used by getTopicCorrelations
topicWordCounts // in processvars (used by getCorrelationGraph)
topNWords // in topictime (used by getCorrelationGraph)

/* SVG functions */
var w = 650,
h = 650;
// Used in plotMatrix
var vis = d3.select("#corr-page")
.append("svg")
.attr("width", w)
.attr("height", h);

// Used by vis
d3.select("#corr-tab").on("click", function() {
    d3.selectAll(".page").style("display", "none");
    d3.selectAll("ul li").attr("class", "");
    d3.select("#corr-page").style("display", "block");
    d3.select("#corr-tab").attr("class", "selected");
  });