import React, { Component } from 'react'; 
import './App.css';
import * as d3 from 'd3';

import {zeros, getQueryString, getObjectKeys} from '../../funcs/utilityFunctions'
import LDAModel from '../../LDAModel/LDAModel'

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

    let startingNumTopics = 25;

    this.state = {
      ldaModel: new LDAModel(startingNumTopics),

      // The file location of default files
      documentsURL: defaultDoc,
      stopwordsURL: defaultStops,

      // Location to store uploaded files
      documentsFileArray: [],
      stoplistFileArray: [],

      selectedTab: "home-tab",

    update: true,
  };
  // TODO make consistent with arrow functions instead of bindings
  this.changeTab = this.changeTab.bind(this);
  // TODO Moved to LDAModel, need new function to replace
  // this.addSweepRequests = this.addSweepRequests.bind(this);
  this.changeSweepAmount = this.changeSweepAmount.bind(this);
  };

  /**
   * @summary Update the page/tab user is looking at, causing rerender of components
   */
  changeTab = (tabID) => {
    this.setState({
      selectedTab: tabID
    });

    console.log("Tab   is now: " + tabID)
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
    });
    this.state.ldaModel.documentType = event.target.files[0].type;
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

  // TODO: figure out what is going on here
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
      this.state.ldaModel.documentType = "text/csv";
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

    this.state.ldaModel.reset();
    Promise.all([this.getStoplistUpload(),this.getDocsUpload()])
      .then(([stops, lines]) => {this.state.ldaModel.ready(null, stops, lines)})
      .catch(err => this.state.ldaModel.ready(err, null, null));
  }
  

  /**
   * @summary This function is the callback for "input", it changes as we move the slider without releasing it.
   */
  updateTopicCount(input) {
    d3.select("#num_topics_display").text(input.value);
  }

  /**
   * @summary This function is the callback for "change"
   */
  onTopicsChange = (val) => {
    console.log("Changing # of topics: " + val);
    
    var newNumTopics = Number(val);
    if (! isNaN(newNumTopics) && newNumTopics > 0 && newNumTopics !== this.state.ldaModel.numTopics) {
      this.state.ldaModel.changeNumTopics(Number(val));
    }
  }

  componentDidMount() {
    // TODO turn d3 into react
    d3.select("#num-topics-input").attr("value", this.state.ldaModel.numTopics);
    this.queueLoad();
    
  }

  /**
   * @summary Callback function for pressing the run iterations button
   */
  changeSweepAmount(val) {
    this.setState( {
      sweepParameter: parseInt(val, 10)
    })
  }

  /**
   * @summary Callback function for pressing the stop button
   */
  stopButtonClick = () => {
    this.state.ldaModel.stopSweeps();
  }


  
  render() {
    var DisplayPage;
    switch (this.state.selectedTab) {
      case "docs-tab":
        DisplayPage = <TopicDoc 
          selectedTopic={this.state.ldaModel.selectedTopic} 
          documents={this.state.ldaModel.documents} 
          sortVocabByTopic={this.state.ldaModel.sortVocabByTopic} 
          numTopics={this.state.ldaModel.numTopics}
          onDocumentFileChange={this.onDocumentFileChange}
          onStopwordFileChange={this.onStopwordFileChange}
          onFileUpload = {this.queueLoad}
          update = {this.state.update}/>;
        break;
      case "corr-tab":
        DisplayPage = <Correlation 
          topicWordCounts ={this.state.ldaModel.topicWordCounts}  
          numTopics={this.state.ldaModel.numTopics} 
          documents={this.state.ldaModel.documents}
          getTopicCorrelations={this.state.ldaModel.getTopicCorrelations}
          update = {this.state.update}/>;
        break;
      case "vocab-tab":
        DisplayPage = <VocabTable 
          sortVocabByTopic={this.state.ldaModel.sortVocabByTopic}
          sortbyTopicChange={this.state.ldaModel.sortbyTopicChange}
          vocabularyCounts={this.state.ldaModel.vocabularyCounts}
          wordTopicCounts={this.state.ldaModel.wordTopicCounts}
          selectedTopic={this.state.ldaModel.selectedTopic}
          stopwords ={this.state.ldaModel.stopwords}
          numTopics={this.state.ldaModel.numTopics}
          byCountDescending={this.state.ldaModel.byCountDescending}
          addStop = {this.state.ldaModel.addStop}
          removeStop = {this.state.ldaModel.removeStop}
          update = {this.state.update}/>;
        break;
      case "ts-tab":
        DisplayPage = <TimeSeries 
          numTopics={this.state.ldaModel.numTopics}
          documents={this.state.ldaModel.documents}
          topicWordCounts={this.state.ldaModel.topicWordCounts}
          update = {this.state.update}/>;
        break;
      case "dl-tab":
        DisplayPage = <DLPage
          numTopics={this.state.ldaModel.numTopics}
          documents={this.state.ldaModel.documents}
          wordTopicCounts={this.state.ldaModel.wordTopicCounts}
          topicWordCounts={this.state.ldaModel.topicWordCounts}
          sortTopicWords={this.state.ldaModel.sortTopicWords}
          getTopicCorrelations={this.state.ldaModel.getTopicCorrelations}
          tokensPerTopic={this.state.ldaModel.tokensPerTopic}/>;
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

    console.log(this.state.ldaModel)

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


      <SideBar selectedTopic={this.state.selectedTopic} 
               sortVocabByTopic={this.state.sortVocabByTopic} 
               numTopics={this.state.numTopics} 
               topicWordCounts={this.state.topicWordCounts}
               selectedTopicChange = {this.selectedTopicChange}
               />

      <div id="tabwrapper">

      <NavBar onClick={this.changeTab}/>
      <div id="pages">

      {this.state.ldaModel.topicWordCounts.length === 0 ? null : DisplayPage}


      </div>
      </div>
      </div>
      </div>
    );
  };
}

export default App;