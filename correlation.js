
  //
  // Topic correlations
  //
  
  /* This function will compute pairwise correlations between topics.
   * Unlike the correlated topic model (CTM) LDA doesn't have parameters
   * that represent topic correlations. But that doesn't mean that topics are
   * not correlated, it just means we have to estimate those values by
   * measuring which topics appear in documents together.
   */
  
// used by ready, changeNumTopics in processing, used by sweep in sweep
function plotMatrix() {
    
    var left = 50;
    var right = 500;
    var top = 50;
    var bottom = 500;
  
    var correlationMatrix = getTopicCorrelations();
    var correlationGraph = getCorrelationGraph(correlationMatrix, -100.0);
  
    var topicScale = d3.scalePoint().domain(d3.range(numTopics)).range([left, right]);
    var radiusScale = d3.scaleSqrt().domain([0, 1.0]).range([0, 450 / (2 * numTopics)]);
  
    var horizontalTopics = vis.selectAll("text.hor").data(correlationGraph.nodes);
    horizontalTopics.exit().remove();
    horizontalTopics = horizontalTopics.enter().append("text")
      .attr("class", "hor")
    .merge(horizontalTopics);
  
    horizontalTopics
      .attr("x", right + 10)
      .attr("y", function(node) { return topicScale(node.name); })
      .text(function(node) { return node.words; });
  
    var verticalTopics = vis.selectAll("text.ver").data(correlationGraph.nodes);
    verticalTopics.exit().remove();
    verticalTopics = verticalTopics.enter().append("text")
      .attr("class", "ver")
    .merge(verticalTopics);
  
    verticalTopics
      .attr("x", function(node) { return topicScale(node.name); })
      .attr("y", bottom + 10)
      .attr("transform", function(node) { return "rotate(90," + topicScale(node.name) + "," + (bottom + 10) + ")"; })
      .text(function(node) { return node.words; });
  
    var circles = vis.selectAll("circle").data(correlationGraph.links);
    circles.exit().remove();
    circles = circles.enter().append("circle").merge(circles);
  
    circles.attr("cx", function(link) { return topicScale(link.source); })
    .attr("cy", function(link) { return topicScale(link.target); })
    .attr("r", function (link) { return radiusScale(Math.abs(link.value)); })
    .style("fill", function (link) { return link.value > 0.0 ? "#88f" : "#f88"; })
    .on("mouseover", function (link) {
      var tooltip = d3.select("#tooltip");
      tooltip.style("visibility", "visible")
      .style("top", (event.pageY-10)+"px").style("left",(event.pageX+20)+"px")
      .text(correlationGraph.nodes[link.target].words + " / " + correlationGraph.nodes[link.source].words);
    })
    .on("mouseout", function () {
      var tooltip = d3.select("#tooltip");
      tooltip.style("visibility", "hidden");
    });
  }

// Used by saveTopicPMI
function getTopicCorrelations() {
  
    // initialize the matrix
    correlationMatrix = new Array(numTopics);
    for (var t1 = 0; t1 < numTopics; t1++) {
      correlationMatrix[t1] = zeros(numTopics);
    }
  
    var topicProbabilities = zeros(numTopics);
  
    // iterate once to get mean log topic proportions
    documents.forEach(function(d, i) {
  
      // We want to find the subset of topics that occur with non-trivial concentration in this document.
      // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
      var documentTopics = new Array();
      var tokenCutoff = Math.max(correlationMinTokens, correlationMinProportion * d.tokens.length);
  
      for (var topic = 0; topic < numTopics; topic++) {
        if (d.topicCounts[topic] >= tokenCutoff) {
          documentTopics.push(topic);
          topicProbabilities[topic]++; // Count the number of docs with this topic
        }
      }
  
      // Look at all pairs of topics that occur in the document.
      for (var i = 0; i < documentTopics.length - 1; i++) {
        for (var j = i + 1; j < documentTopics.length; j++) {
          correlationMatrix[ documentTopics[i] ][ documentTopics[j] ]++;
          correlationMatrix[ documentTopics[j] ][ documentTopics[i] ]++;
        }
      }
    });
    for (var t1 = 0; t1 < numTopics - 1; t1++) {
      for (var t2 = t1 + 1; t2 < numTopics; t2++) {
        correlationMatrix[t1][t2] = Math.log((documents.length * correlationMatrix[t1][t2]) /
                                             (topicProbabilities[t1] * topicProbabilities[t2]));
        correlationMatrix[t2][t1] = Math.log((documents.length * correlationMatrix[t2][t1]) /
                                             (topicProbabilities[t1] * topicProbabilities[t2]));
      }
    }
  
    return correlationMatrix;
  }

function getCorrelationGraph(correlationMatrix, cutoff) {
    var graph = {"nodes": [], "links": []};
    for (var topic = 0; topic < numTopics; topic++) {
      graph.nodes.push({"name": topic, "group": 1, "words": topNWords(topicWordCounts[topic], 3)});
    }
    for (var t1 = 0; t1 < numTopics; t1++) {
      for (var t2 = 0; t2 < numTopics; t2++) {
        if (t1 !== t2 && correlationMatrix[t1][t2] > cutoff) {
          graph.links.push({"source": t1, "target": t2, "value": correlationMatrix[t1][t2]});
        }
      }
    }
    return graph;
  }