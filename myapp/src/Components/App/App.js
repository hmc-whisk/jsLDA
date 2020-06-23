import React, { Component } from 'react'; 
import './App.css';
import * as d3 from 'd3';
import {zeros, getQueryString, getObjectKeys} from '../../funcs/utilityFunctions'

import Correlation from '../Pages/Correlation';
import TopicDoc from '../Pages/TopicDoc';
import SideBar from '../SideBar';
import VocabTable from '../Pages/VocabTable';
import TimeSeries from '../Pages/TimeSeries';
import NavBar from '../Header/NavBar';
import TopBar from '../Header/TopBar';
import DLPage from '../Pages/DLPage';
import HomePage from '../Pages/HomePage';

var XRegExp = require('xregexp')

// This adds the Object.keys() function to some old browsers that don't support it
if (!Object.keys) {
  Object.keys = (getObjectKeys());
}

var QueryString = getQueryString();

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
    
    selectedTab: "home-tab",

    update: true,
  };
  
  this.changeTab = this.changeTab.bind(this);
  this.addSweepRequests = this.addSweepRequests.bind(this);
  this.changeSweepAmount = this.changeSweepAmount.bind(this);
  };
  sweeps = 0; //Used for finding whether an additional sweep call should be called
  topicWeight = []; // temp storage for data in sweep
  tokenPerTopic = [];

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

  /**
   * @summary Retrieve doc files from upload component and set documentType
   */
  onDocumentFileChange = (event) => {
    event.preventDefault();

    // Prevent empty file change errors
    if(!event.target.files[0]){return;}

    console.log(event.target.files[0].type)
    this.setState({
      documentsFileArray: [Array.prototype.slice.call(event.target.files)],
      documentType: event.target.files[0].type,
    });
  }

  /**
   * @summary Retrieve stop word files from upload component
   */
  onStopwordFileChange = (event) => {
    event.preventDefault();
    
    // Prevent empty file change errors
    if(!event.target.files[0]){return;}

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


  /**
   * @summary Returns a promise of the correct stopword text
   * @returns {Promise<String>} stopword text
   *  - first document in documentsFileArray state if it exists
   *  - stopwordsURL resource file otherwise
   */
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
  
  /**
   * @summary Returns a promise of the correct document text
   * @returns {Promise<String>} document text
   *  - first document in documentsFileArray state if it exists
   *  - documentsURL resource file otherwise
   */
  getDocsUpload = () => (new Promise((resolve) => {
    if (this.state.documentsFileArray.length === 0) {
      this.setState({ documentType: "text/plain"});
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

  /**
   * @summary Resets all the model related props in preperation
   * for new documents to be processed
   */
  reset() {
    this.setState({
      sweepParameter: 50,
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
      tokensPerTopic: zeros(this.state.numTopics),
      topicWeights: zeros(this.state.numTopics),
      documents: [],
    })

    // TODO: change this do React code
    // d3.select("#num-topics-input").property("value", this.state.numTopics);
    // d3.select("#iters").text(this.state.completeSweeps);
    d3.selectAll("div.document").remove();
  }

  /**
   * @summary Runs the document processing pipeline
   */
  queueLoad = () => {

    this.reset();
    Promise.all([this.getStoplistUpload(),this.getDocsUpload()])
      .then(([stops, lines]) => {this.ready(null, stops, lines)})
      .catch(err => this.ready(err, null, null));
  }
  
  /**
   * @summary Sets up state from document/stopword info
   * @param {Error} error
   * @param {String} stops string of stop words with one per line
   * @param {String} lines string of documents in tsv or csv format
   *  - Lines should not have column names included
   *  - Should either include 3 columns in [ID]\t[TAG]\t[TEXT] format or
   *    one column of just the text
   */
  ready = (error, stops, lines) => {
    if (error) { 
      //alert("File upload failed. Please try again."); TODO: uncomment this for deployment
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
  sortTopicWords = () => {
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

  /**
   * @summary Processes document text to set up topic model
   * @param docText {String} a string of a tsv or csv file
   *  - Without column names
   *  - In format [ID],[TAG],[TEXT] or [TEXT]
   * This function calles upon the documentType state member
   * to determine whether docText is a csv or tsv. If it isnt
   * "text/csv" then it will assume it is a tsv.
   */
  parseDoc = (docText) => {
    // Avoid mutating state directly
    let temp_stopwords = {...this.state.stopwords};
    let temp_vocabularyCounts = {...this.state.vocabularyCounts};
    let temp_tokensPerTopic = zeros(this.state.numTopics);
    let temp_wordTopicCounts = {...this.state.wordTopicCounts};
    let temp_vocabularySize = this.state.vocabularySize;
    let temp_documents = this.state.documents.slice();
    let numTopics = this.state.numTopics;

    if(this.state.documentType == "text/csv") {
      var parsedDoc = d3.csvParseRows(docText);
    } else {
      var parsedDoc = d3.tsvParseRows(docText);
    }

    for(let i = 0; i < parsedDoc.length; i++) {
      let fields = parsedDoc[i];
      var docID = this.state.documents.length;
      var docDate = "";

      var text = fields[0];  // Assume there's just one field, the text
      if (fields.length === 3) {  // If it's in [ID]\t[TAG]\t[TEXT] format...
        docID = fields[0];
        docDate = fields[1]; // do not interpret date as anything but a string
        text = fields[2];
      }
    
      var tokens = [];
      var rawTokens = text.toLowerCase().match(XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g"));
      if (rawTokens == null) { continue; }
      var topicCounts = zeros(numTopics);
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

  // This function is the callback for "change"
  onTopicsChange = (val) => {
    console.log("Changing # of topics: " + val);
    
    var newNumTopics = Number(val);
    if (! isNaN(newNumTopics) && newNumTopics > 0 && newNumTopics !== this.numTopics) {
      this.changeNumTopics(Number(val));
    }
  }

  /**
   * @summary Shifts model to have a dif number of topics
   * @param {Number} numTopics_ new number of topics
   */
  changeNumTopics(numTopics_) {
    let temp_selectedTopic = -1;
    let temp_topicWordCounts = [];
    let temp_tokensPerTopic = zeros(numTopics_);
    let temp_topicWeights = zeros(numTopics_);
    let temp_documents = this.state.documents.slice();
    let temp_wordTopicCounts = {};
    let temp_completeSweeps = 0;
    let temp_requestedSweeps = 0;

    d3.select("#iters").text(temp_completeSweeps);
    
    Object.keys(this.state.vocabularyCounts).forEach(function (word) { temp_wordTopicCounts[word] = {} });

    temp_documents.forEach(( currentDoc, i ) => {

      currentDoc.topicCounts = zeros(numTopics_);
      for (let position = 0; position < currentDoc.tokens.length; position++) {
        let token = currentDoc.tokens[position];
        token.topic = Math.floor(Math.random() * numTopics_);
        
        if (! token.isStopword) {
          temp_tokensPerTopic[token.topic]++;
          if (! temp_wordTopicCounts[token.word][token.topic]) {
            temp_wordTopicCounts[token.word][token.topic] = 1;
          }
          else {
            temp_wordTopicCounts[token.word][token.topic] += 1;

          }
          currentDoc.topicCounts[token.topic] += 1;
        }
      }
    });

    this.setState({
      selectedTopic: temp_selectedTopic,
      completeSweeps: temp_completeSweeps,
      requestedSweeps: temp_requestedSweeps,
      numTopics: numTopics_,
      topicWordCounts: temp_topicWordCounts,
      tokensPerTopic: temp_tokensPerTopic,
      topicWeights: temp_topicWeights,
      documents: temp_documents,
      wordTopicCounts: temp_wordTopicCounts
    }, () => this.sortTopicWords()); // Wait until state has changed to sort

    // displayTopicWords();
    // reorderDocuments();
    // vocabTable();
    
  }

  sweep = () => {
    var startTime = Date.now();

    // Avoid mutating state
    let temp_tokensPerTopic = this.tokenPerTopic.slice();
    let temp_topicWeights = this.topicWeight.slice();
    let temp_numTopics = this.state.numTopics;
    let temp_topicWordSmoothing = this.state.topicWordSmoothing;
    let temp_vocabularySize = this.state.vocabularySize;
    let temp_documents = this.state.documents
    let temp_wordTopicCounts = this.state.wordTopicCounts;
    let temp_documentTopicSmoothing = this.state.documentTopicSmoothing;


    var topicNormalizers = zeros(temp_numTopics);
    for (let topic = 0; topic < temp_numTopics; topic++) {
      topicNormalizers[topic] = 1.0 / 
      (temp_vocabularySize * temp_topicWordSmoothing + 
        temp_tokensPerTopic[topic]);
    }

    for (let doc = 0; doc < temp_documents.length; doc++) {
      let currentDoc = temp_documents[doc];
      let docTopicCounts = currentDoc.topicCounts;

      for (let position = 0; position < currentDoc.tokens.length; position++) {
        let token = currentDoc.tokens[position];
        if (token.isStopword) { continue; }

        temp_tokensPerTopic[ token.topic ]--;
        let currentWordTopicCounts = temp_wordTopicCounts[ token.word ];
        currentWordTopicCounts[ token.topic ]--;
        if (currentWordTopicCounts[ token.topic ] === 0) {
          //delete(currentWordTopicCounts[ token.topic ]);
        }
        docTopicCounts[ token.topic ]--;
        topicNormalizers[ token.topic ] = 1.0 / 
          (temp_vocabularySize * temp_topicWordSmoothing +
            temp_tokensPerTopic[ token.topic ]);

        let sum = 0.0;
        for (let topic = 0; topic < temp_numTopics; topic++) {
          if (currentWordTopicCounts[ topic ]) {
            temp_topicWeights[topic] =
              (temp_documentTopicSmoothing + docTopicCounts[topic]) *
              (temp_topicWordSmoothing + currentWordTopicCounts[ topic ]) *
            topicNormalizers[topic];
          }
          else {
            temp_topicWeights[topic] =
              (temp_documentTopicSmoothing + docTopicCounts[topic]) *
              temp_topicWordSmoothing *
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
          (temp_vocabularySize * temp_topicWordSmoothing +
          temp_tokensPerTopic[ token.topic ]);
      }
    }

    console.log("sweep in " + (Date.now() - startTime) + " ms");

    this.tokenPerTopic = temp_tokensPerTopic;
    this.topicWeight = temp_topicWeights;
    // this.setState({
    //   completeSweeps: this.state.completeSweeps + 1,
    //   tokensPerTopic: temp_tokensPerTopic,
    //   topicWeights: temp_topicWeights,
    // })

    this.setState({ completeSweeps: this.state.completeSweeps + 1})

    // TODO: change d3 to React
    d3.select("#iters").text(this.state.completeSweeps);

    if (this.state.completeSweeps >= this.state.requestedSweeps) {
    this.setState({
      tokensPerTopic: temp_tokensPerTopic,
      topicWeights: temp_topicWeights,
      update: true,
    })
      //reorderDocuments();
      this.sortTopicWords();
      // displayTopicWords();
      // plotMatrix();
      // vocabTable();
      // timeSeries();
      this.timer.stop();
      this.sweeps = 0;
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

  /**
   * @summary This function will compute pairwise correlations between topics.
   * @returns {Array<Array<Number>>} 2d array of correlation values
   * @description Unlike the correlated topic model (CTM) LDA doesn't have 
   * parameters that represent topic correlations. But that doesn't mean that
   * topics are not correlated, it just means we have to estimate those values
   * by measuring which topics appear in documents together.
   */
  getTopicCorrelations = () => {

    // initialize the matrix
    let correlationMatrix = [this.state.numTopics];
    for (var t1 = 0; t1 < this.state.numTopics; t1++) {
      correlationMatrix[t1] = zeros(this.state.numTopics);
    }

    var topicProbabilities = zeros(this.state.numTopics);

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

  componentDidMount() {
    this.findNumTopics();
    // Set upon initialisation, changed to new numTopics in reset
    d3.select("#num-topics-input").attr("value", this.state.numTopics);
    
    this.setState({tokensPerTopic: zeros(this.state.numTopics)});
    this.setState({topicWeights: zeros(this.state.numTopics)});

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
      requestedSweeps: this.state.requestedSweeps + this.state.sweepParameter,
      update: false,

    });
    // TODO: Cottect Beginning of iteration
    // TODO: Change these things to states
    if (this.sweeps === 0) {
      this.sweeps = 1;
      this.topicWeight = this.state.topicWeights;
      this.tokenPerTopic = this.state.tokensPerTopic;
      this.timer = d3.timer(this.sweep);
      console.log("Requested Sweeps Now: " + this.state.requestedSweeps);
    }
  }

  changeSweepAmount(val) {
    this.setState( {
      sweepParameter: parseInt(val, 10)
    })
  }

  stopButtonClick = () => {
    this.setState({
      requestedSweeps: this.state.completeSweeps + 1,
    })
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
          update = {this.state.update}/>;
        break;
      case "corr-tab":
        DisplayPage = <Correlation 
          topicWordCounts ={this.state.topicWordCounts}  
          numTopics={this.state.numTopics} 
          documents={this.state.documents}
          getTopicCorrelations={this.getTopicCorrelations}
          update = {this.state.update}/>;
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
          removeStop = {this.removeStop}
          update = {this.state.update}/>;
        break;
      case "ts-tab":
        DisplayPage = <TimeSeries 
          numTopics={this.state.numTopics}
          documents={this.state.documents}
          topicWordCounts={this.state.topicWordCounts}
          update = {this.state.update}/>;
        break;
      case "dl-tab":
        DisplayPage = <DLPage
          numTopics={this.state.numTopics}
          documents={this.state.documents}
          wordTopicCounts={this.state.wordTopicCounts}
          topicWordCounts={this.state.topicWordCounts}
          sortTopicWords={this.sortTopicWords}
          getTopicCorrelations={this.getTopicCorrelations}
          tokensPerTopic={this.state.tokensPerTopic}/>;
        break;
      case "home-tab":
        DisplayPage = <HomePage
          onDocumentFileChange={this.onDocumentFileChange}
          onStopwordFileChange={this.onStopwordFileChange}
          onFileUpload = {this.queueLoad}/>
        break;
      default:
        DisplayPage = null;
        break;
    }

    return (
      <div id="app">
      <div id="tooltip"></div>

      <div id="main">

      <TopBar completeSweeps={this.state.completeSweeps} 
            requestedSweeps = {this.state.requestedSweeps} 
            numTopics={this.state.tempNumTopics} 
            onClick={this.addSweepRequests} 
            updateNumTopics={this.onTopicsChange} 
            sweepParameter={this.state.sweepParameter}
            onChange={this.changeSweepAmount}
            stopButtonClick={this.stopButtonClick}
            />
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

      <NavBar onClick={this.changeTab}/>
      <div id="pages">

      {this.state.topicWordCounts.length === 0 ? null : DisplayPage}


      </div>
      </div>
      </div>
      </div>
    );
  };
}

export default App;