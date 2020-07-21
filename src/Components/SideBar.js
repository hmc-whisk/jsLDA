import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../funcs/utilityFunctions'

class SideBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
      }
    
    // Used for setting and resetting notes
    numBefore = 0;
    reset = 0;


    selectedTopicChange = this.props.selectedTopicChange;

    // Used by ready, changeNumTopics in processing, addStop, removeStop in vocab, sweep in sweep
    displayTopicWords() {
        console.log("displayTopicWords");
        var topicTopWords = [];
        let toggleTopicDocuments = this.toggleTopicDocuments;
        let changeAnnotation = this.props.changeAnnotation

    
        for (let topic = 0; topic < this.props.numTopics; topic++) {
        if (this.props.topicWordCounts[topic]) {
        topicTopWords.push(topNWords(this.props.topicWordCounts[topic], 10));}
        }

        // Hard reset sidebar
        d3.select("div#topics").selectAll("div.topics").remove();
    
        var topicLines = d3.select("div#topics").selectAll("div.topics")
        .data(topicTopWords);
    
        topicLines.exit().remove();
        
        let topic = topicLines
        .enter().append("div").attr("class","topics");

        topic.append("foreignObject")
        .append('xhtml:div')
        .append('div')
        .attr("class","textField")
        .attr("style", "white-space: pre-line; background: #ECECEC; border-collapse: separate; border-radius: 3px; ")
        .attr("dataText", "Enter annotation")
        .attr("contentEditable", true)
        .on("blur", function(d, i) {
          var innerText = this.innerText 
          if(innerText[innerText.length-1] === '\n'){
            innerText = innerText.slice(0,-1)}    
          changeAnnotation(innerText, i)
          
        })
        .on("notesEdit", function(d, i) { this.innerText = "" } )
        .text((d,i) => this.props.getAnnotation(i))

        if (this.reset ===1) {
            d3.select("div#topics").selectAll("div.textField").dispatch("notesEdit")
            this.reset = 0
        }

        topicLines = topic.append("div")
        .attr("class", "topicwords")
        .on("click", function(d, i) { toggleTopicDocuments(i); })
        .text(function(d, i) { return "[" + i + "] " + d; })

        .merge(topicLines);
        
        // Format selected topic
        d3.selectAll("div.topicwords").attr("class", (d, i) =>  
            i === this.props.selectedTopic ? "topicwords selected" : "topicwords");
    
        return this.props.topicWordCounts;
    }

    // Used by displayTopicWords in display
    toggleTopicDocuments = (topic) => {

        if (topic === this.props.selectedTopic) {
        // unselect the topic
        d3.selectAll("div.topicwords").attr("class", "topicwords");

        //sortVocabByTopic = false;
        d3.select("#sortVocabByTopic").text("Sort by topic")

        this.selectedTopicChange(-1);
        }
        else {
        this.selectedTopicChange(topic);
        }
    }
    
    componentDidMount() {
        this.toggleTopicDocuments(0)
    }

    componentDidUpdate() {
        let resetAnnotation = this.props.resetAnnotation
        if (this.numBefore != this.props.numTopics) {
            this.numBefore = this.props.numTopics;
            this.reset = 1;
            resetAnnotation(this.props.numTopics);
        }
        this.displayTopicWords();
    }

    render() {
        return (
        <div className="sidebar">

        <div id="topics" className="sidebox">
        </div>
  
        </div>
        )
    }
}

export default SideBar