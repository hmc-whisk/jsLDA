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
    reset = 0; // TL: used in componentDidMount


    selectedTopicChange = this.props.selectedTopicChange;

    // TL: dup
    toggleTopicDocuments = (topic) => {
        if (topic === this.props.selectedTopic) {
            // unselect the topic
            d3.selectAll("div.topicwords").attr("class", "topicwords");
            //sortVocabByTopic = false;
            // TL: this comes in as a prop
            d3.select("#sortVocabByTopic").text("Sort by topic")
            this.props.selectedTopicChange(-1);
        }
        else {
            this.props.selectedTopicChange(topic);
        }
    }

    // Used by ready, changeNumTopics in processing, addStop, removeStop in vocab, sweep in sweep
    displayTopicWords() {
        console.log("displayTopicWords");
        var topicTopWords = []; // TL: one string per topic containing top 10 words for that topic
        let toggleTopicDocuments = this.toggleTopicDocuments;
        let changeAnnotation = this.props.changeAnnotation

        // TL: for each topic, push single string containing top 10 words to topicTopWords
        for (let topic = 0; topic < this.props.numTopics; topic++) {
            if (this.props.topicWordCounts[topic]) { 
                topicTopWords.push(topNWords(this.props.topicWordCounts[topic], 10));
            }
        }

        // Hard reset sidebar
        d3.select("div#topics").selectAll("div.topics").remove();

    
        // TL: does this start with any topics already in there?? 
        // TL: just did the "hard reset" thing
        var topicLines = d3.select("div#topics").selectAll("div.topics")
        .data(topicTopWords); // TL: binds topics div to topicTopWords lists and returns new div topicLines
    
        topicLines.exit().remove(); // TL: gets rid of topicLines that did not have topicTopWords associated
        
        // TL: topic is all the topicLines originally w/o divs, now with <div className="topics">
        // TL: QUESTION does this end with topic including ALL topicLines + new divs? or only the new divs? 
        // TL: is everything just new divs?? 
        let topic = topicLines
        .enter().append("div").attr("class","topics");

        topic.append("foreignObject")
        .append('xhtml:div')
        .append('div')
        .attr("class","textField")
        .attr("style", "white-space: pre-line; background: var(--color3Dark); border-collapse: separate; border-radius: 3px; ")
        .attr("dataText", "Enter annotation")
        .attr("contentEditable", true)
        .on("blur", function(d, i) {
            var innerText = this.innerText 
            if(innerText[innerText.length-1] === '\n'){
                innerText = innerText.slice(0,-1)
            }    
            changeAnnotation(innerText, i)
          
        })
        .on("notesEdit", function(d, i) { this.innerText = "" } )
        .text((d,i) => this.props.getAnnotation(i))

        // TL: if this.reset call onNotesEdit 
        if (this.reset === 1) {
            d3.select("div#topics").selectAll("div.textField").dispatch("notesEdit")
            this.reset = 0
        }

        topicLines = topic.append("div")
        .attr("class", "topicwords")
        .on("click", function(d, i) { toggleTopicDocuments(i); })
        .text(function(d, i) { return "[" + i + "] " + d; })

        .merge(topicLines); // TL: merges all lists into one flattened list
        
        // Format selected topic
        d3.selectAll("div.topicwords").attr("class", (d, i) =>  
            i === this.props.selectedTopic ? "topicwords selected" : "topicwords");

        ///////////
        // <div className={i === this.props.selectedTopic ? "topicwords selected" : "topicwords"}/> 

    
        return this.props.topicWordCounts;
    }

    // Used by displayTopicWords in display
    toggleTopicDocuments = (topic) => {
        if (topic === this.props.selectedTopic) {
            // unselect the topic
            d3.selectAll("div.topicwords").attr("class", "topicwords");
            //sortVocabByTopic = false;
            // TL: this comes in as a prop
            d3.select("#sortVocabByTopic").text("Sort by topic")
            this.props.selectedTopicChange(-1);
        }
        else {
            this.props.selectedTopicChange(topic);
        }
    }
    
    componentDidMount() {
        this.toggleTopicDocuments(0)
    }

    componentDidUpdate() {
        let resetAnnotation = this.props.resetAnnotation
        if (this.numBefore !== this.props.numTopics) {
            this.numBefore = this.props.numTopics;
            this.reset = 1;
            resetAnnotation(this.props.numTopics);
        }
    }

    render() {

        // Original
        // return (
        // <div className="sidebar">
        //     <div id="topics" className="sidebox" />
        // </div>
        // )
        let topicTopWords = [];
        let { numTopics, topicWordCounts, changeAnnotation, getAnnotation, selectedTopic } = this.props;

        // TL: for each topic, push single string containing top 10 words to topicTopWords
        for (let topic = 0; topic < numTopics; topic++) {
            if (topicWordCounts[topic]) { 
                topicTopWords.push(topNWords(topicWordCounts[topic], 10));
            }
        }

        // TL TODO: handle reset 
        return (
            <div className="sidebar">
                {
                    topicTopWords.map((topwords, i) => (
                        <div id="topics" className="sidebox" key={i}>

                            {/* Annotation text field */}
                            <div 
                                className="textField"
                                style={{
                                    whiteSpace: "preLine", 
                                    backgroundColor: "lightGray", 
                                    borderCollapse: "separate",
                                    borderRadius: "3px"}}
                                dataText="Enter annotation"
                                contentEditable={true}
                                onBlur={(d, i) => {
                                    var innerText = this.innerText 
                                    if(innerText && innerText[innerText.length-1] === '\n'){
                                        innerText = innerText.slice(0,-1)
                                    }    
                                    changeAnnotation(innerText, i)
                                }}
                                onNotesReset={() => { this.innerText = ""}}
                                value={() => getAnnotation(i)}
                            />

                            {/* List of top words */}
                            <div 
                                className={(i === selectedTopic) ? "topicwords selected" : "topicwords"}
                                onClick={() => this.toggleTopicDocuments(i)}
                            >
                                {`[${i}] ${topwords}`}
                            </div>
                        </div>
                        )
                    )
                }
            </div>
        )
    }
}

export default SideBar