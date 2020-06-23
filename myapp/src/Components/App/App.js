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

import defaultDoc from '../../defaultDocs/documents.csv'
import defaultStops from '../../defaultDocs/stoplist.txt'


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

    // The file location of default files
    documentsURL: defaultDoc,
    stopwordsURL: defaultStops,

    // Location to store uploaded files
    documentsFileArray: [],
    stoplistFileArray: [],

    selectedTab: "home-tab",

    update: true,
  };
  
  this.changeTab = this.changeTab.bind(this);
  // TODO Moved to LDAModel, need new function to replace
  // this.addSweepRequests = this.addSweepRequests.bind(this);
  this.changeSweepAmount = this.changeSweepAmount.bind(this);
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

  /**
   * @summary Retrieve doc files from upload component and set documentType
   */
  onDocumentFileChange = (event) => {
    event.preventDefault();

    // Prevent empty file change errors
    if(!event.target.files[0]){return;}

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
      this.setState({ documentType: "text/csv"});
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
   * @summary Runs the document processing pipeline
   */
  queueLoad = () => {

    this.reset();
    Promise.all([this.getStoplistUpload(),this.getDocsUpload()])
      .then(([stops, lines]) => {this.ready(null, stops, lines)})
      .catch(err => this.ready(err, null, null));
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


  componentDidMount() {
    this.findNumTopics();
    // Set upon initialisation, changed to new numTopics in reset
    d3.select("#num-topics-input").attr("value", this.state.numTopics);
    
    this.setState({tokensPerTopic: zeros(this.state.numTopics)});
    this.setState({topicWeights: zeros(this.state.numTopics)});

    this.queueLoad();
    
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