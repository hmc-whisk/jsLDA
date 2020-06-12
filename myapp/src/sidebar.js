import React, { Component } from 'react'; 
import * as d3 from 'd3';

class SideBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
      }

    topNWords(wordCounts, n) {
        return wordCounts.slice(0,n).map( function(d) { return d.word; }).join(" ");
    };

    selectedTopicChange = this.props.selectedTopicChange;

    // Used by ready, changeNumTopics in processing, addStop, removeStop in vocab, sweep in sweep
    displayTopicWords() {
        var topicTopWords = [];
        let toggleTopicDocuments = this.toggleTopicDocuments;
    
        for (var topic = 0; topic < this.props.numTopics; topic++) {
        if (this.props.topicWordCounts[topic]) {
        topicTopWords.push(this.topNWords(this.props.topicWordCounts[topic], 10));}
        }
    
        var topicLines = d3.select("div#topics").selectAll("div.topicwords")
        .data(topicTopWords);
    
        topicLines.exit().remove();
        
        topicLines = topicLines
        .enter().append("div")
        .attr("class", "topicwords")
        .on("click", function(d, i) { toggleTopicDocuments(i); })
        .merge(topicLines);
        
        topicLines.transition().text(function(d, i) { return "[" + i + "] " + d; });
    
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
        // reorderDocuments();
        // vocabTable();
    }
    
    componentDidMount() {
        this.toggleTopicDocuments(0)
    }

    static getDerivedStateFromProps(props, state) {
    }

    componentDidUpdate() {
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