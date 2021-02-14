import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../funcs/utilityFunctions'

class SideBar extends Component {

    // NOTE: kept the d3 implementation of this function because
    // it affects an external element (sortVocabByTopic)
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

    // When number of topics is changed, model resets and annotations
    // should be cleared 
    clearAnnotations = () => {
        document.getElementById("topic-annotations").reset();
    }
    
    
    componentDidMount() {
        this.toggleTopicDocuments(0)
    }

    componentDidUpdate(prevProps) {
        // if numTopics has changed, model has reset and annotations should clear
        if (prevProps.numTopics !== this.props.numTopics) {
            this.clearAnnotations();
        }
    }

    render() {
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
                <form id="topic-annotations">
                {
                    topicTopWords.map((topwords, i) => (
                        <div 
                            id="topics" 
                            className="sidebox" 
                            key={i}
                            style={{marginBottom: "-5px"}}
                        >

                            {/* Annotation text field */}
                            <textarea 
                                className="textField"
                                style={{
                                    whiteSpace: "preLine", 
                                    backgroundColor: "var(--color3Dark)", 
                                    borderCollapse: "separate",
                                    color: "black",
                                    borderRadius: "3px",
                                    border: "none",
                                    width: "100%",
                                    height: "30px"}}
                                wrap="soft"
                                placeholder="Enter annotation"
                                onBlur={(e) => {
                                    if(e.target.value && e.target.value[e.target.value.length-1] === '\n'){
                                        e.target.value = e.target.value.slice(0,-1);
                                    }    
                                    changeAnnotation(e.target.value, i);
                                }}
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
                </form>
            </div>
        )
    }
}

export default SideBar