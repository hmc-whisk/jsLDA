import React, { Component } from 'react'; 
import './App.css';
import * as d3 from 'd3';
import Correlation from './Correlation';
import TopicDoc from './TopicDoc';
import SideBar from './sidebar';
import VocabTable from './VocabTable';
import TimeSeries from './TimeSeries';
import Nav from './navButtons';
import Form from './paramForm';
import DLPage from './DLPage';

var XRegExp = require('xregexp')

// Where is it used?
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
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

class App extends Component {
  constructor(props) {
    super(props)
  this.state = {

    // Temporary variable for manipulating input bar
    tempNumTopics:25,

    // Vocabulary statistics

    // Needed by reset & parseline
    vocabularySize: 0,

    // The file location of default files
    documentsURL: process.env.PUBLIC_URL + "/documents.txt",
    stopwordsURL: process.env.PUBLIC_URL + "/stoplist.txt",

    // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
    correlationMinTokens: 2,
    correlationMinProportion: 0.05,


    // needed by reset & parseline, changeNumTopics
    vocabularyCounts: {},

    //needed by reset
    sortVocabByTopic: false,
    specificityScale: d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]),

    // Topic model parameters

    // needed by reset & sortTopicWords, changeNumTopics
    numTopics: 0, // run findNumTopics upon mount

    // required by reset & ready & parseline
    stopwords: {},

    // required by reset, changeNumTopics
    completeSweeps: 0,
    requestedSweeps: 0,

    // in reset, changeNumTopics

    selectedTopic: 0,

    // Needed by reset & parseline & sortTopicWords, changeNumTopics
    wordTopicCounts: {},

    // Needed by reset & sortTopicWords, changeNumTopics
    topicWordCounts: [],

    // Needed by reset & parseline, changeNumTopics
    tokensPerTopic: [], // set to zeros(numTopics)

    // in reset, changeNumTopics
    topicWeights: [], // set to zeros(numTopics)

    // Array of dictionaries with keys 
    // {"originalOrder", "id", "date", "originalText", "tokens", "topicCounts"}
    // used by reset & parseline, changeNumTopics
    documents: [],

    // Location to store uploaded files
    documentsFileArray: [],
    stoplistFileArray: [],

    // used by sortTopicWords
    byCountDescending: function (a,b) { return b.count - a.count; },

    // used by parseLine
    truncate: function(s) { return s.length > 300 ? s.substring(0, 299) + "..." : s; },
    wordPattern: XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g"),

    timer: 0, // used in sweep
    documentTopicSmoothing: 0.1, // (used by sweep)
    topicWordSmoothing: 0.01, // (used by sweep)
    
    selectedTab: "docs-tab"
  };
  
  this.changeTab = this.changeTab.bind(this);
  this.addSweepRequests = this.addSweepRequests.bind(this);
  this.updateTempNumTopics = this.updateTempNumTopics.bind(this);
};

  changeTab = (tabID) => {
    this.setState({
      selectedTab: tabID
    });

    console.log("Tab   is now: " + tabID)
  }

  // Used by sidebar to change selectedTopic and sortVocabByTopic
  selectedTopicChange = (topic) => {
    this.setState({selectedTopic: topic});
    if (topic === -1) {

      this.setState({sortVocabByTopic: false})
    }
  }

  sortbyTopicChange = (sort) => {
    this.setState({sortVocabByTopic: sort})
  }

  // Retrieve doc files from upload component
  onDocumentFileChange = (event) => {
    event.preventDefault();
    console.log(event.target.files)
    this.setState({
      documentsFileArray: [Array.prototype.slice.call(event.target.files)],
    });
  }

  // Retrieve stop word files from upload component
  onStopwordFileChange = (event) => {
    event.preventDefault();
    console.log(event)
    this.setState({
      stoplistFileArray: [Array.prototype.slice.call(event.target.files)],
    });

  }

  findNumTopics() {
    this.setState({numTopics: QueryString.topics ? parseInt(QueryString.topics) : 25});
    if (isNaN(this.state.numTopics)) {
    alert("The requested number of topics [" + QueryString.topics + "] couldn't be interpreted as a number");
    this.setState({numTopics:25});
    }
  }

  zeros = (n) => {
    var x = new Array(n);
    for (var i = 0; i < n; i++) { x[i] = 0.0; }
    return x;
  }

  getStoplistUpload = () => (new Promise((resolve) => {
    if (this.state.stoplistFileArray.length === 0) {
        resolve(d3.text(this.state.stopwordsURL));
      } else {
      const fileSelection = this.state.stoplistFileArray[0].slice();
      let reader = new FileReader();
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.readAsText(fileSelection[0]);
    }
  }));
  
  getDocsUpload = () => (new Promise((resolve) => {
    if (this.state.documentsFileArray.length === 0) {
        resolve(d3.text(this.state.documentsURL));
    } else {
      const fileSelection = this.state.documentsFileArray[0].slice();
      var reader = new FileReader();
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.readAsText(fileSelection[0]);
    }
  }));

  reset() {
    this.setState({
      vocabularySize: 0,
      vocabularyCounts: {},
      sortVocabByTopic: false,
      specificityScale: d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]),
      stopwords: {},
      completeSweeps: 0,
      requestedSweeps: 0,
      selectedTopic: -1,
      wordTopicCounts: {},
      topicWordCounts: [],
      tokensPerTopic: this.zeros(this.state.numTopics),
      topicWeights: this.zeros(this.state.numTopics),
      documents: [],
    })

    // TODO: change this do React code
    // d3.select("#num-topics-input").property("value", this.state.numTopics);
    // d3.select("#iters").text(this.state.completeSweeps);
    d3.selectAll("div.document").remove();
  }

  queueLoad = () => {

    this.reset();
    Promise.all([this.getStoplistUpload(),this.getDocsUpload()])
      .then(([stops, lines]) => {this.ready(null, stops, lines)})
      .catch(err => this.ready(err, null, null));
  }
  
  ready = (error, stops, lines) => {
    if (error) { 
      //alert("File upload failed. Please try again."); // TODO: uncomment when it won't be obnoxious
      throw error;
    } else {
      // Avoid direct state mutation 
      let temp_stopwords = {...this.state.stopwords};

      // Create the stoplist
      stops.split(/\s+/).forEach((w) => {temp_stopwords[w] = 1; });

      this.setState({
        stopwords: temp_stopwords,
      });
  
      // Load documents and populate the vocabulary
      //lines.split("\n").forEach(this.parseLine);
      this.parseDoc(lines);
  
      this.sortTopicWords();

      //displayTopicWords();
      // toggleTopicDocuments(0);
      //plotGraph();
      
      // plotMatrix();
      // vocabTable();
      // createTimeSVGs();
      // timeSeries();
    }
  }

  truncate (s) { return s.length > 300 ? s.substring(0, 299) + "..." : s; }

  // used by addStop, removeStop in vocab, saveTopicKeys in downloads, sweep in sweep
  sortTopicWords() {
    let tempTopicWordCounts = [];
    for (let topic = 0; topic < this.state.numTopics; topic++) {
      tempTopicWordCounts[topic] = [];
    }
  
    for (let word in this.state.wordTopicCounts) {
      for (let topic in this.state.wordTopicCounts[word]) {
        tempTopicWordCounts[topic].push({"word":word, "count":this.state.wordTopicCounts[word][topic]});
      }
    }
  
    for (let topic = 0; topic < this.state.numTopics; topic++) {
      tempTopicWordCounts[topic].sort(this.state.byCountDescending);
    }

    this.setState({topicWordCounts: tempTopicWordCounts});    
    // this.topicWordCounts = [];
    // for (let topic = 0; topic < this.numTopics; topic++) {
    //   this.topicWordCounts[topic] = [];
    // }
  
    // for (let word in this.wordTopicCounts) {
    //   for (let topic in this.wordTopicCounts[word]) {
    //     this.topicWordCounts[topic].push({"word":word, "count":this.wordTopicCounts[word][topic]});
    //   }
    // }
  
    // for (let topic = 0; topic < this.numTopics; topic++) {
    //   this.topicWordCounts[topic].sort(this.byCountDescending);
    // }
  }

  parseDoc = (lines) =>  {
    // Avoid mutating state directly
    let temp_stopwords = {...this.state.stopwords};
    let temp_vocabularyCounts = {...this.state.vocabularyCounts};
    // let temp_tokensPerTopic = this.state.tokensPerTopic.slice();
    let temp_tokensPerTopic = this.zeros(this.state.numTopics);
    let temp_wordTopicCounts = {...this.state.wordTopicCounts};
    let temp_vocabularySize = this.state.vocabularySize;
    let temp_documents = this.state.documents.slice();
    let numTopics = this.state.numTopics;

    let splitLines = lines.split("\n");
    console.log(temp_tokensPerTopic)

    for(let i = 0; i < splitLines.length; i++) {
      let line = splitLines[i];
      if (line === "") { continue; }
      var docID = this.state.documents.length;
      //console.log("Parsing document: " + line);
      var docDate = "";
      var fields = line.split("\t");
      var text = fields[0];  // Assume there's just one field, the text
      if (fields.length === 3) {  // If it's in [ID]\t[TAG]\t[TEXT] format...
        docID = fields[0];
        docDate = fields[1]; // do not interpret date as anything but a string
        text = fields[2];
      }
    
      var tokens = [];
      var rawTokens = text.toLowerCase().match(XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g"));
      if (rawTokens == null) { continue; }
      var topicCounts = this.zeros(numTopics);
      rawTokens.forEach(function (word) {
        if (word !== "") {
          var topic = Math.floor(Math.random() * (numTopics));
    
          if (word.length <= 2) { temp_stopwords[word] = 1; }
    
          var isStopword = temp_stopwords[word];
          if (isStopword) {
            // Record counts for stopwords, but nothing else
            if (! temp_vocabularyCounts[word]) {
              temp_vocabularyCounts[word] = 1;
            }
            else {
              temp_vocabularyCounts[word] += 1;
            }
          }
          else {
            temp_tokensPerTopic[topic]++;
            if (! temp_wordTopicCounts[word]) {
              temp_wordTopicCounts[word] = {};
              temp_vocabularySize++;
              temp_vocabularyCounts[word] = 0;
            }
            if (!temp_wordTopicCounts[word][topic]) {
              temp_wordTopicCounts[word][topic] = 0;
            }
            temp_wordTopicCounts[word][topic] += 1;
            temp_vocabularyCounts[word] += 1;
            topicCounts[topic] += 1;
          }
          tokens.push({"word":word, "topic":topic, "isStopword":isStopword });
        }
      });
      temp_documents.push({ 
        "originalOrder" : temp_documents.length,
        "id" : docID,
        "date" : docDate,
        "originalText" : text,
        "tokens" : tokens,
        "topicCounts" : topicCounts
      });

      // Need to move this selection and adding to #docs-page into a different component
      d3.select("div#docs-page").append("div")
        .attr("class", "document")
        .text("[" + docID + "] " + this.truncate(text));
    }
    console.log("Broke out of loop");
    this.setState({
      stopwords: temp_stopwords,
      vocabularyCounts: temp_vocabularyCounts,
      tokensPerTopic: temp_tokensPerTopic,
      wordTopicCounts: temp_wordTopicCounts,
      vocabularySize: temp_vocabularySize,
      documents: temp_documents,
    });


  }

  // This function is the callback for "input", it changes as we move the slider
  //  without releasing it.
  updateTopicCount(input) {
    d3.select("#num_topics_display").text(input.value);
  }

  // This function is the callback for "change", it only fires when we release the
  //  slider to select a new value.
  onTopicsChange(input) {
    console.log("Changing # of topics: " + input.value);
    
    var newNumTopics = Number(input.value);
    if (! isNaN(newNumTopics) && newNumTopics > 0 && newNumTopics !== this.numTopics) {
      this.changeNumTopics(Number(input.value));
    }
  }

  changeNumTopics(numTopics_) {
    this.numTopics = numTopics_;
    this.selectedTopic = 0;

    
    this.completeSweeps = 0;
    this.requestedSweeps = 0;
    d3.select("#iters").text(this.completeSweeps);
    
    let tempWordTopicCounts = {};
    Object.keys(this.vocabularyCounts).forEach(function (word) { tempWordTopicCounts[word] = {} });
    this.setState({wordTopicCounts:tempWordTopicCounts})

    // this.wordTopicCounts = {};
    // Object.keys(this.vocabularyCounts).forEach(function (word) { this.wordTopicCounts[word] = {} });
    
    let tempTopicWordCounts = [];
    let tempTokensPerTopic = this.zeros(this.numTopics);
    let tempTopicWeights = this.zeros(this.numTopics);
    let tempDocuments = this.documents;
    tempWordTopicCounts = this.wordTopicCounts;

    tempDocuments.forEach( function( currentDoc, i ) {

      currentDoc.topicCounts = this.zeros(this.numTopics);
      for (var position = 0; position < currentDoc.tokens.length; position++) {
        var token = currentDoc.tokens[position];
        token.topic = Math.floor(Math.random() * this.numTopics);
        
        if (! token.isStopword) {
          tempTokensPerTopic[token.topic]++;
          if (! tempWordTopicCounts[token.word][token.topic]) {
            tempWordTopicCounts[token.word][token.topic] = 1;
          }
          else {
            tempWordTopicCounts[token.word][token.topic] += 1;

          }
          currentDoc.topicCounts[token.topic] += 1;
        }
      }
    });

    this.setState({
      topicWordCounts: tempTopicWordCounts,
      tokensPerTopic: tempTokensPerTopic,
      topicWeights: tempTopicWeights,
      documents: tempDocuments,
      wordTopicCounts: tempWordTopicCounts
    });

    // this.topicWordCounts = [];
    // this.tokensPerTopic = this.zeros(this.numTopics);
    // this.topicWeights = this.zeros(this.numTopics);
    
    // this.documents.forEach( function( currentDoc, i ) {
    //   currentDoc.topicCounts = this.zeros(this.numTopics);
    //   for (var position = 0; position < currentDoc.tokens.length; position++) {
    //     var token = currentDoc.tokens[position];
    //     token.topic = Math.floor(Math.random() * this.numTopics);
        
    //     if (! token.isStopword) {
    //       this.tokensPerTopic[token.topic]++;
    //       if (! this.wordTopicCounts[token.word][token.topic]) {
    //         this.wordTopicCounts[token.word][token.topic] = 1;
    //       }
    //       else {
    //         this.wordTopicCounts[token.word][token.topic] += 1;
    //       }
    //       currentDoc.topicCounts[token.topic] += 1;
    //     }
    //   }
    // });

    this.sortTopicWords();
    // displayTopicWords();
    // reorderDocuments();
    // vocabTable();
    
    // Restart the visualizations
    // createTimeSVGs();
    // timeSeries();
    // plotMatrix();
  }

  sweep = () => {
    var startTime = Date.now();

    // Avoid mutating state
    console.log( this.state.tokensPerTopic);
    let temp_tokensPerTopic = this.state.tokensPerTopic.slice();
    let temp_topicWeights = this.state.topicWeights.slice();

    var topicNormalizers = this.zeros(this.state.numTopics);
    for (let topic = 0; topic < this.state.numTopics; topic++) {
      topicNormalizers[topic] = 1.0 / 
      (this.state.vocabularySize * this.state.topicWordSmoothing + 
        temp_tokensPerTopic[topic]);
    }

    for (let doc = 0; doc < this.state.documents.length; doc++) {
      let currentDoc = this.state.documents[doc];
      let docTopicCounts = currentDoc.topicCounts;

      for (let position = 0; position < currentDoc.tokens.length; position++) {
        let token = currentDoc.tokens[position];
        if (token.isStopword) { continue; }

        temp_tokensPerTopic[ token.topic ]--;
        let currentWordTopicCounts = this.state.wordTopicCounts[ token.word ];
        currentWordTopicCounts[ token.topic ]--;
        if (currentWordTopicCounts[ token.topic ] === 0) {
          //delete(currentWordTopicCounts[ token.topic ]);
        }
        docTopicCounts[ token.topic ]--;
        topicNormalizers[ token.topic ] = 1.0 / 
          (this.state.vocabularySize * this.state.topicWordSmoothing +
            this.state.tokensPerTopic[ token.topic ]);

        let sum = 0.0;
        for (let topic = 0; topic < this.state.numTopics; topic++) {
          if (currentWordTopicCounts[ topic ]) {
            temp_topicWeights[topic] =
              (this.state.documentTopicSmoothing + docTopicCounts[topic]) *
              (this.state.topicWordSmoothing + currentWordTopicCounts[ topic ]) *
            topicNormalizers[topic];
          }
          else {
            temp_topicWeights[topic] =
              (this.state.documentTopicSmoothing + docTopicCounts[topic]) *
              this.state.topicWordSmoothing *
            topicNormalizers[topic];
          }
          sum += temp_topicWeights[topic];

        }

        // Sample from an unnormalized discrete distribution
        var sample = sum * Math.random();
          var i = 0;
          sample -= temp_topicWeights[i];
          while (sample > 0.0) {
            i++;
            sample -= temp_topicWeights[i];
        }
        token.topic = i;

        temp_tokensPerTopic[ token.topic ]++;

        if (! currentWordTopicCounts[ token.topic ]) {
          currentWordTopicCounts[ token.topic ] = 1;
        }
        else {
          currentWordTopicCounts[ token.topic ] += 1;
        }
        docTopicCounts[ token.topic ]++;

        topicNormalizers[ token.topic ] = 1.0 / 
          (this.state.vocabularySize * this.state.topicWordSmoothing +
          temp_tokensPerTopic[ token.topic ]);
      }
    }

    console.log("sweep in " + (Date.now() - startTime) + " ms");

    this.setState({
      completeSweeps: this.state.completeSweeps + 1,
      tokensPerTopic: temp_tokensPerTopic,
      topicWeights: temp_topicWeights,
    })

    // TODO: change d3 to React
    d3.select("#iters").text(this.state.completeSweeps);

    if (this.state.completeSweeps >= this.state.requestedSweeps) {

      //reorderDocuments();
      this.sortTopicWords();
      // displayTopicWords();
      // plotMatrix();
      // vocabTable();
      // timeSeries();
      this.timer.stop();
    }
  }

  //configure after button

  addStop = (word) => {
    let stopwords = this.state.stopwords;
    let vocabularySize = this.state.vocabularySize;
    let wordTopicCounts = this.state.wordTopicCounts;
    let documents = this.state.documents;
    let tokensPerTopic = this.state.tokensPerTopic;

    stopwords[word] = 1;
    vocabularySize--;
    delete wordTopicCounts[word];
  
    documents.forEach( function( currentDoc, i ) {
    var docTopicCounts = currentDoc.topicCounts;
    for (var position = 0; position < currentDoc.tokens.length; position++) {
      var token = currentDoc.tokens[position];
      if (token.word === word) {
        token.isStopword = true;
        tokensPerTopic[ token.topic ]--;
        docTopicCounts[ token.topic ]--;
        }
      }
    });

    this.setState({
      stopwords: stopwords,
      vocabularySize: vocabularySize,
      wordTopicCounts: wordTopicCounts,
      documents: documents,
      tokensPerTopic: tokensPerTopic
    });
  
    this.sortTopicWords();
    // displayTopicWords();
    // reorderDocuments();
    // vocabTable();
  }

  //configure after button
  removeStop = (word) => {
    let stopwords = this.state.stopwords;
    let vocabularySize = this.state.vocabularySize;
    let wordTopicCounts = this.state.wordTopicCounts;
    let documents = this.state.documents;
    let tokensPerTopic = this.state.tokensPerTopic;

    delete stopwords[word];
    vocabularySize++;
    wordTopicCounts[word] = {};
    var currentWordTopicCounts = wordTopicCounts[ word ];
  
    documents.forEach( function( currentDoc, i ) {
      var docTopicCounts = currentDoc.topicCounts;
      for (var position = 0; position < currentDoc.tokens.length; position++) {
        var token = currentDoc.tokens[position];
        if (token.word === word) {
          token.isStopword = false;
          tokensPerTopic[ token.topic ]++;
          docTopicCounts[ token.topic ]++;
          if (! currentWordTopicCounts[ token.topic ]) {
            currentWordTopicCounts[ token.topic ] = 1;
          }
          else {
            currentWordTopicCounts[ token.topic ] += 1;
          }
        }
      }
    });

    this.setState({
      stopwords: stopwords,
      vocabularySize: vocabularySize,
      wordTopicCounts: wordTopicCounts,
      documents: documents,
      tokensPerTopic: tokensPerTopic
    });
  
    this.sortTopicWords();
    // displayTopicWords();
    // reorderDocuments();
    // vocabTable();
  }

  /* This function will compute pairwise correlations between topics.
 * Unlike the correlated topic model (CTM) LDA doesn't have parameters
 * that represent topic correlations. But that doesn't mean that topics are
 * not correlated, it just means we have to estimate those values by
 * measuring which topics appear in documents together.
 */
getTopicCorrelations = () => {

  // initialize the matrix
  let correlationMatrix = [this.state.numTopics];
  for (var t1 = 0; t1 < this.state.numTopics; t1++) {
    correlationMatrix[t1] = this.zeros(this.state.numTopics);
  }

  var topicProbabilities = this.zeros(this.state.numTopics);

  // iterate once to get mean log topic proportions
  this.state.documents.forEach((d, i) => {

    // We want to find the subset of topics that occur with non-trivial concentration in this document.
    // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
    var documentTopics = [];
    var tokenCutoff = Math.max(this.state.correlationMinTokens, 
      this.state.correlationMinProportion * d.tokens.length);

    for (let topic = 0; topic < this.state.numTopics; topic++) {
      if (d.topicCounts[topic] >= tokenCutoff) {
        documentTopics.push(topic);
        topicProbabilities[topic]++; // Count the number of docs with this topic
      }
    }

    // Look at all pairs of topics that occur in the document.
    for (let i = 0; i < documentTopics.length - 1; i++) {
      for (let j = i + 1; j < documentTopics.length; j++) {
        correlationMatrix[ documentTopics[i] ][ documentTopics[j] ]++;
        correlationMatrix[ documentTopics[j] ][ documentTopics[i] ]++;
      }
    }
  });

  for (let t1 = 0; t1 < this.state.numTopics - 1; t1++) {
    for (let t2 = t1 + 1; t2 < this.state.numTopics; t2++) {
      correlationMatrix[t1][t2] = Math.log((this.state.documents.length * correlationMatrix[t1][t2]) /
                                           (topicProbabilities[t1] * topicProbabilities[t2]));
      correlationMatrix[t2][t1] = Math.log((this.state.documents.length * correlationMatrix[t2][t1]) /
                                           (topicProbabilities[t1] * topicProbabilities[t2]));
    }
  }

  return correlationMatrix;
}

  topNWords(wordCounts, n) { 
    return wordCounts.slice(0,n).map( function(d) { return d.word; }).join(" "); 
  };

  componentDidMount() {
    this.findNumTopics();
    // Set upon initialisation, changed to new numTopics in reset
    d3.select("#num-topics-input").attr("value", this.state.numTopics);
    
    this.setState({tokensPerTopic: this.zeros(this.state.numTopics)});
    this.setState({topicWeights: this.zeros(this.state.numTopics)});

    this.queueLoad();
    
    // // used by parseLine
    // d3.select("#docs-tab").on("click", function() {
    //   d3.selectAll(".page").style("display", "none");
    //   d3.selectAll("ul li").attr("className", "");
    //   d3.select("#docs-page").style("display", "block");
    //   d3.select("#docs-tab").attr("className", "selected");
    // });
  }

  addSweepRequests() {
    this.setState({
      requestedSweeps: this.state.requestedSweeps + 50
    });
    // TODO: Cottect Beginning of iteration
    this.timer = d3.timer(this.sweep);
    console.log("Requested Sweeps Now: " + this.state.requestedSweeps);
  }

  updateTempNumTopics(val) {
    this.setState({
      tempNumTopics: val
    });
    console.log("Num Topics Now: : " + this.state.tempNumTopics);
  }
  
  render() {


    var DisplayPage;
    switch (this.state.selectedTab) {
      case "docs-tab":
        DisplayPage = <TopicDoc 
          selectedTopic={this.state.selectedTopic} 
          documents={this.state.documents} 
          sortVocabByTopic={this.state.sortVocabByTopic} 
          truncate={this.state.truncate}
          numTopics={this.state.numTopics}
          onDocumentFileChange={this.onDocumentFileChange}
          onStopwordFileChange={this.onStopwordFileChange}
          onFileUpload = {this.queueLoad}
        />;
        break;
      case "corr-tab":
        DisplayPage = <Correlation 
          topicWordCounts ={this.state.topicWordCounts} 
          topNWords={this.state.topNWords} 
          numTopics={this.state.numTopics} 
          zeros={this.zeros} 
          documents={this.state.documents}/>;
        break;
      case "vocab-tab":
        DisplayPage = <VocabTable 
          sortVocabByTopic={this.state.sortVocabByTopic}
          sortbyTopicChange={this.sortbyTopicChange}
          vocabularyCounts={this.state.vocabularyCounts}
          wordTopicCounts={this.state.wordTopicCounts}
          selectedTopic={this.state.selectedTopic}
          stopwords ={this.state.stopwords}
          numTopics={this.state.numTopics}
          byCountDescending={this.state.byCountDescending}
          addStop = {this.addStop}
          removeStop = {this.removeStop}/>;
        break;
      case "ts-tab":
        DisplayPage = <TimeSeries 
          numTopics={this.state.numTopics}
          documents={this.state.documents}
          topicWordCounts={this.state.topicWordCounts}/>;
        break;
      case "dl-tab":
        DisplayPage = <DLPage
          numTopics={this.state.numTopics}
          documents={this.state.documents}
          wordTopicCounts={this.state.wordTopicCounts}
          topicWordCounts={this.state.topicWordCounts}
          sortTopicWords={this.sortTopicWords}
          topNWords={this.topNWords}
          getTopicCorrelations={this.getTopicCorrelations}
          tokensPerTopic={this.state.tokensPerTopic}  />;
        break;
      default:
        DisplayPage = null;
        break;
    }

    return (
      <div id="app">
      <div id="tooltip"></div>

      <div id="main">

      {/* TODO: on button press, start iterating*/}
      {/* TODO: onBlur, only updates when clicked outside, rather than letting go of slider*/}
      <Form completeSweeps={this.state.completeSweeps} 
            requestedSweeps = {this.state.requestedSweeps} 
            numTopics={this.state.tempNumTopics} 
            onClick={this.addSweepRequests} 
            onBlur={this.updateTempNumTopics} />
      {/* <div id="form" className="top">
        <button id="sweep">Run 50 iterations</button>
        Iterations: <span id="iters">0</span>

      <span id="num_topics_control">Train with <input id="num-topics-input" type="range" name="topics" value="25" min="3" max="100" onInput="updateTopicCount(this)" onChange="onTopicsChange(this)"/> <span id="num_topics_display">25</span> topics</span>
      </div> */}

      <SideBar selectedTopic={this.state.selectedTopic} 
               sortVocabByTopic={this.state.sortVocabByTopic} 
               numTopics={this.state.numTopics} 
               topicWordCounts={this.state.topicWordCounts}
               selectedTopicChange = {this.selectedTopicChange}
               />

      <div id="tabwrapper">

      <Nav onClick={this.changeTab}/>
      <div id="pages">

      {DisplayPage}


      </div>
      </div>
      </div>
      </div>
    );
  };
}

export default App;