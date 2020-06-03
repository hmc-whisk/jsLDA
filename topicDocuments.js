// Used by displayTopicWords in display
function toggleTopicDocuments(topic) {
    if (topic === selectedTopic) {
      // unselect the topic
      d3.selectAll("div.topicwords").attr("class", "topicwords");
      selectedTopic = -1;
  
    sortVocabByTopic = false;
    d3.select("#sortVocabByTopic").text("Sort by topic")
    }
    else {
      d3.selectAll("div.topicwords").attr("class", function(d, i) { return i === topic ? "topicwords selected" : "topicwords"; });
      selectedTopic = topic;
    }
    reorderDocuments();
    vocabTable();
  }

// used by addStop, removeStop in vocab
function reorderDocuments() {
    var format = d3.format(".2g");
  
    if (selectedTopic === -1) {
      documents.sort(function(a, b) { return d3.ascending(a.originalOrder, b.originalOrder); });
      d3.selectAll("div.document").data(documents)
      .style("display", "block")
      .text(function(d) { return "[" + d.id + "] " + truncate(d.originalText); });
    }
    else {
      var scores = documents.map(function (doc, i) {
        return {docID: i, score: (doc.topicCounts[selectedTopic] + docSortSmoothing) / (doc.tokens.length + sumDocSortSmoothing)};
      });
      scores.sort(function(a, b) {
        return b.score - a.score;
      });
      /*documents.sort(function(a, b) {
          var score1 = (a.topicCounts[selectedTopic] + docSortSmoothing) / (a.tokens.length + sumDocSortSmoothing);
          var score2 = (b.topicCounts[selectedTopic] + docSortSmoothing) / (b.tokens.length + sumDocSortSmoothing);
          return d3.descending(score1, score2);
      }); */
      d3.selectAll("div.document").data(scores)
        .style("display", function(d) { return documents[d.docID].topicCounts[selectedTopic] > 0 ? "block" : "none"; })
        .text(function(d) { return "[" + documents[d.docID].id + "/" + format(d.score * 100) + "%] " + truncate(documents[d.docID].originalText); });
     }
  }