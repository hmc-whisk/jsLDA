// Used by ready, changeNumTopics in processing, addStop, removeStop in vocab, sweep in sweep
function displayTopicWords() {
    var topicTopWords = [];
  
    for (var topic = 0; topic < numTopics; topic++) {
      topicTopWords.push(topNWords(topicWordCounts[topic], 10));
    }
  
    var topicLines = d3.select("div#topics").selectAll("div.topicwords")
      .data(topicTopWords);
  
    topicLines.exit().remove();
    
    topicLines = topicLines
    .enter().append("div")
    .attr("class", "topicwords")
    .on("click", function(d, i) { toggleTopicDocuments(i); })
    .merge(topicLines);
    
    topicLines.transition().text(function(d, i) { return "[" + i + "] " + d; });
  
    return topicWordCounts;
  }