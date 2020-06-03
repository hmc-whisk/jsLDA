//
  // Vocabulary statistics (needed by processes (reset))
  //
// Needed by reset & parseline
var vocabularySize = 0;
// needed by reset & parseline
var vocabularyCounts = {};
//needed by reset
var displayingStopwords = false;
var sortVocabByTopic = false;
var specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);

    //
  // Topic model parameters (numTopics required by reset)
  //
// needed by reset & sortTopicWords
var numTopics = QueryString.topics ? parseInt(QueryString.topics) : 25;
if (isNaN(numTopics)) {
alert("The requested number of topics [" + QueryString.topics + "] couldn't be interpreted as a number");
numTopics = 25;
}

// stopwords required by reset & ready & parseline
  
var stopwords = {};

// required by reset
var completeSweeps = 0;
var requestedSweeps = 0;

// Set upon initialisation, changed to new numTopics in reset
d3.select("#num-topics-input").attr("value", numTopics);

// in reset
var selectedTopic = -1;

// Needed by reset & parseline & sortTopicWords
var wordTopicCounts = {};

// Needed by reset & sortTopicWords
var topicWordCounts = [];

// Needed by reset & parseline
var tokensPerTopic = zeros(numTopics);

// in reset
var topicWeights = zeros(numTopics);

// used by reset & parseline
var documents = [];