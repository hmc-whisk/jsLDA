import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../funcs/utilityFunctions';
import Spinner from 'react-bootstrap/Spinner';

class SideBar extends Component {

    state = {
        topics: null,
        displayOrder: [],
    }

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

    initTopics = (numTops, topWordCounts) => {
        // for some reason can't get topWordCounts from componentDidMount but can get them from render
        console.log("initTopics called", numTops, topWordCounts);
        if (topWordCounts.length > 0) {
            let topicsDict = {};
            for (let topic = 0; topic < numTops; topic++) {
                if (topWordCounts[topic]) { 
                    topicsDict[topic] = topNWords(this.props.topicWordCounts[topic], 10)
                }
            }
            // console.log(topicsDict);

            this.setState({
                topics: topicsDict,
                displayOrder: Array.from(Array(numTops).keys())
            });
            // console.log(this.state);
        }
    }

    // When number of topics is changed, model resets and annotations
    // should be cleared 
    clearAnnotations = () => {
        document.getElementById("topic-annotations").reset();
    }
    
    
    componentDidMount() {
        this.toggleTopicDocuments(0);
    }

    componentDidUpdate(prevProps) {
        // if numTopics has changed, should reinitialize topics and clear annotations
        // if topicWordCounts just finished loading, call initTopics
        if (prevProps.numTopics !== this.props.numTopics 
            || prevProps.topicWordCounts.length === 0 && this.props.topicWordCounts.length > 0) {
            this.clearAnnotations();
            this.initTopics(this.props.numTopics, this.props.topicWordCounts);
        }
    }

    render() {
        const { changeAnnotation, getAnnotation, selectedTopic } = this.props;
        
        return (
            <div className="sidebar">
                <form id="topic-annotations">
                {
                    this.state.displayOrder.map((topNum) => (
                        <div 
                            id="topics" 
                            className="sidebox" 
                            key={topNum}
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
                                    changeAnnotation(e.target.value, topNum);
                                }}
                            />

                            {/* List of top words */}
                            <div 
                                className={(topNum === selectedTopic) ? "topicwords selected" : "topicwords"}
                                onClick={() => this.toggleTopicDocuments(topNum)}
                            >
                                {`[${topNum}] ${this.state.topics[topNum]}`}
                            </div>
                        </div>
                        )
                    )
                }
                </form>
            </div>
        ) // TODO: spinner while topicWordCounts loads
    }
}

export default SideBar;