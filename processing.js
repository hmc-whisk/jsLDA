queueLoad(); // Function called upon loading website

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
// used by addStop, removeStop in vocab, saveTopicKeys in downloads, sweep in sweep
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

// Used by saveDocTopics, saveTopicWords, saveGraph in downloads, getTopicCorrelations in correlation
function zeros(n) {
  var x = new Array(n);
  for (var i = 0; i < n; i++) { x[i] = 0.0; }
  return x;
}


// Change the strings at the end of these lines to reset the default filenames!


function onDocumentFileChange(input) {
  documentsFileArray = input.files;
}
function onStopwordFileChange(input) {
  stoplistFileArray = input.files;
}

// This function is the callback for "input", it changes as we move the slider
//  without releasing it.
function updateTopicCount(input) {
  d3.select("#num_topics_display").text(input.value);
}
// This function is the callback for "change", it only fires when we release the
//  slider to select a new value.
function onTopicsChange(input) {
  console.log("Changing # of topics: " + input.value);
  
  var newNumTopics = Number(input.value);
  if (! isNaN(newNumTopics) && newNumTopics > 0 && newNumTopics !== numTopics) {
    changeNumTopics(Number(input.value));
  }
}

function changeNumTopics(numTopics_) {
  numTopics = numTopics_;
  selectedTopic = -1;
  
  completeSweeps = 0;
  requestedSweeps = 0;
  d3.select("#iters").text(completeSweeps);
  
  wordTopicCounts = {};
  Object.keys(vocabularyCounts).forEach(function (word) { wordTopicCounts[word] = {} });
  
  topicWordCounts = [];
  tokensPerTopic = zeros(numTopics);
  topicWeights = zeros(numTopics);
  
  documents.forEach( function( currentDoc, i ) {
    currentDoc.topicCounts = zeros(numTopics);
    for (var position = 0; position < currentDoc.tokens.length; position++) {
      var token = currentDoc.tokens[position];
      token.topic = Math.floor(Math.random() * numTopics);
      
      if (! token.isStopword) {
        tokensPerTopic[token.topic]++;
        if (! wordTopicCounts[token.word][token.topic]) {
          wordTopicCounts[token.word][token.topic] = 1;
        }
        else {
          wordTopicCounts[token.word][token.topic] += 1;
        }
        currentDoc.topicCounts[token.topic] += 1;
      }
    }
  });

  sortTopicWords();
  displayTopicWords();
  reorderDocuments();
  vocabTable();
  
  // Restart the visualizations
  createTimeSVGs();
  timeSeries();
  plotMatrix();
}