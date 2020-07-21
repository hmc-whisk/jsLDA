import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../funcs/utilityFunctions'

class SideBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
      }
    
    notes = new Array(this.props.numTopics);
    numBefore = 0
    reset = 0


    selectedTopicChange = this.props.selectedTopicChange;

    // Used by ready, changeNumTopics in processing, addStop, removeStop in vocab, sweep in sweep
    displayTopicWords() {
        var topicTopWords = [];
        let toggleTopicDocuments = this.toggleTopicDocuments;
        let notes = this.notes;

    
        for (let topic = 0; topic < this.props.numTopics; topic++) {
        if (this.props.topicWordCounts[topic]) {
        topicTopWords.push(topNWords(this.props.topicWordCounts[topic], 10));}
        }
    
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
          notes[i] = innerText;
          console.log("blur")
          console.log(notes)
        })
        .on("notesEdit", function(d, i) { this.innerText = "" } )

        if (this.reset ===1) {
            d3.select("div#topics").selectAll("div.textField").dispatch("notesEdit")
            this.reset = 0
        }

        topicLines = topic.append("div")
        .attr("class", "topicwords")
        .on("click", function(d, i) { toggleTopicDocuments(i); })
        .text(function(d, i) { return "[" + i + "] " + d; })

        .merge(topicLines);
        
        // topicLines.transition().text(function(d, i) { return "[" + i + "] " + d; });
    
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
        d3.selectAll("div.topicwords").attr("class", function(d, i) { return i === topic ? "topicwords selected" : "topicwords"; });
        this.selectedTopicChange(topic);
        }
    }
    
    componentDidMount() {
        this.toggleTopicDocuments(0)
    }

    componentDidUpdate() {
        if (this.numBefore != this.props.numTopics) {
            this.numBefore = this.props.numTopics;
            this.notes = new Array(this.props.numTopics);
            this.reset = 1;
        }
        this.displayTopicWords();
        console.log(this.notes)
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