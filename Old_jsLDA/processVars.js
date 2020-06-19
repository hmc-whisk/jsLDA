
// Used for numTopics
/** This function is copied from stack overflow: http://stackoverflow.com/users/19068/quentin */
var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
    return query_string;
} ();

// Where is it used?
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}
// Vocabulary statistics (needed by processes (reset))
//
// Needed by reset & parseline
var vocabularySize = 0;
// needed by reset & parseline, changeNumTopics
var vocabularyCounts = {};
//needed by reset
var displayingStopwords = false;
var sortVocabByTopic = false;
var specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);

    //
  // Topic model parameters (numTopics required by reset)
  //
// needed by reset & sortTopicWords, changeNumTopics
var numTopics = QueryString.topics ? parseInt(QueryString.topics) : 25;
if (isNaN(numTopics)) {
alert("The requested number of topics [" + QueryString.topics + "] couldn't be interpreted as a number");
numTopics = 25;
}

// stopwords required by reset & ready & parseline
  
var stopwords = {};

// required by reset, changeNumTopics
var completeSweeps = 0;
var requestedSweeps = 0;

// Set upon initialisation, changed to new numTopics in reset
d3.select("#num-topics-input").attr("value", numTopics);

// in reset, changeNumTopics
var selectedTopic = -1;

// Needed by reset & parseline & sortTopicWords, changeNumTopics
var wordTopicCounts = {};

// Needed by reset & sortTopicWords, changeNumTopics
var topicWordCounts = [];

// Needed by reset & parseline, changeNumTopics
var tokensPerTopic = zeros(numTopics);

// in reset, changeNumTopics
var topicWeights = zeros(numTopics);

// used by reset & parseline, changeNumTopics
var documents = [];

// used by sortTopicWords
var byCountDescending = function (a,b) { return b.count - a.count; }; 

// used by parseLine
d3.select("#docs-tab").on("click", function() {
  d3.selectAll(".page").style("display", "none");
  d3.selectAll("ul li").attr("class", "");
  d3.select("#docs-page").style("display", "block");
  d3.select("#docs-tab").attr("class", "selected");
});

// used by parseLine
var truncate = function(s) { return s.length > 300 ? s.substring(0, 299) + "..." : s; }
var wordPattern = XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g");
