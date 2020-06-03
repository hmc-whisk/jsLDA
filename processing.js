
function queueLoad() {
    reset();
    d3.queue()
      .defer(getStoplistUpload)
      .defer(getDocsUpload)
      .await(ready);
  }

function reset() {
    vocabularySize = 0;
    vocabularyCounts = {};
    displayingStopwords = false;
    sortVocabByTopic = false;
    specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);
    
    d3.select("#num-topics-input").property("value", numTopics);
  
    stopwords = {};
  
    completeSweeps = 0;
    requestedSweeps = 0;
    d3.select("#iters").text(completeSweeps);
  
    selectedTopic = -1;
  
    wordTopicCounts = {};
    topicWordCounts = [];
    tokensPerTopic = zeros(numTopics);
    topicWeights = zeros(numTopics);
    
    documents = [];
    d3.selectAll("div.document").remove();
  }
  
function ready(error, stops, lines) {
    if (error) { alert("File upload failed. Please try again."); throw error;}
    else {
      // Create the stoplist
      console.log(stops);
      stops.split(/\s+/).forEach(function (w) { console.log(w); stopwords[w] = 1; });
  
      // Load documents and populate the vocabulary
      lines.split("\n").forEach(parseLine);
  
      sortTopicWords();
      displayTopicWords();
      toggleTopicDocuments(0);
      //plotGraph();
  
      plotMatrix();
      vocabTable();
      createTimeSVGs();
      timeSeries();
    }
  }
  
function parseLine ( line ) {
    if (line == "") { return; }
    var docID = documents.length;
    var docDate = "";
    var fields = line.split("\t");
    var text = fields[0];  // Assume there's just one field, the text
    if (fields.length == 3) {  // If it's in [ID]\t[TAG]\t[TEXT] format...
      docID = fields[0];
      docDate = fields[1]; // do not interpret date as anything but a string
      text = fields[2];
    }
  
    var tokens = [];
    var rawTokens = text.toLowerCase().match(wordPattern);
    if (rawTokens == null) { return; }
    var topicCounts = zeros(numTopics);
  
    rawTokens.forEach(function (word) {
      if (word !== "") {
        var topic = Math.floor(Math.random() * numTopics);
  
        if (word.length <= 2) { stopwords[word] = 1; }
  
        var isStopword = stopwords[word];
        if (isStopword) {
          // Record counts for stopwords, but nothing else
          if (! vocabularyCounts[word]) {
            vocabularyCounts[word] = 1;
          }
          else {
            vocabularyCounts[word] += 1;
          }
        }
        else {
          tokensPerTopic[topic]++;
          if (! wordTopicCounts[word]) {
            wordTopicCounts[word] = {};
            vocabularySize++;
            vocabularyCounts[word] = 0;
          }
          if (! wordTopicCounts[word][topic]) {
            wordTopicCounts[word][topic] = 0;
          }
          wordTopicCounts[word][topic] += 1;
          vocabularyCounts[word] += 1;
          topicCounts[topic] += 1;
        }
        tokens.push({"word":word, "topic":topic, "isStopword":isStopword });
      }
    });
  
    documents.push({ "originalOrder" : documents.length, "id" : docID, "date" : docDate, "originalText" : text, "tokens" : tokens, "topicCounts" : topicCounts});
    d3.select("div#docs-page").append("div")
       .attr("class", "document")
       .text("[" + docID + "] " + truncate(text));
  }
// used by addStop, removeStop in vocab
function sortTopicWords() {
    topicWordCounts = [];
    for (var topic = 0; topic < numTopics; topic++) {
      topicWordCounts[topic] = [];
    }
  
    for (var word in wordTopicCounts) {
      for (var topic in wordTopicCounts[word]) {
        topicWordCounts[topic].push({"word":word, "count":wordTopicCounts[word][topic]});
      }
    }
  
    for (var topic = 0; topic < numTopics; topic++) {
      topicWordCounts[topic].sort(byCountDescending);
    }
  }