import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../funcs/utilityFunctions';
import Spinner from 'react-bootstrap/Spinner';

import { PinAngle, PinAngleFill, EyeSlash, EyeSlashFill } from 'react-bootstrap-icons';

class SideBar extends Component {

    state = {
        topics: null, // {topic#: { topWords: ..., isPinned: ..., isHidden: ... }, ...}
        displayOrder: [], // keeps track of pinning and hiding
    }

    // NOTE: kept the d3 implementation of this function because
    // it affects an external element (sortVocabByTopic)
    toggleTopicDocuments = (topic) => {
        if (topic === this.props.selectedTopic) {
            // unselect the topic
            // d3.selectAll("div.topicwords").attr("class", "topicwords");
            //sortVocabByTopic = false;
            d3.select("#sortVocabByTopic").text("Sort by topic")
            this.props.selectedTopicChange(-1);
        }
        else {
            this.props.selectedTopicChange(topic);
        }
    }


    initTopics = (numTops, topWordCounts) => {
        if (topWordCounts.length > 0) {
            let topicsDict = {};
            for (let topic = 0; topic < numTops; topic++) {
                if (topWordCounts[topic]) { 
                    topicsDict[topic] = {
                        topWords: topNWords(this.props.topicWordCounts[topic], 10),
                        isPinned: false,
                        isHidden: false,
                    }
                }
            }
            this.setState({
                topics: topicsDict,
                displayOrder: Array.from(Array(numTops).keys())
            });
        }
    }

    toggleTopicPin = (topNum) => {
        let topicsCopy = {...this.state.topics};

        let dispOrderCopy = [...this.state.displayOrder];
        dispOrderCopy = dispOrderCopy.filter(tn => tn !== topNum);

        if (this.state.topics[topNum].isPinned) { // topic gets unpinned
            let i;
            for (i = 0; i < dispOrderCopy.length+1; i++) {
                let currTop = this.state.displayOrder[i];
                // should insert unpinned topics before hidden topics
                if (this.state.topics[currTop].isHidden) {
                    break;
                }
                // insert topNum in correct spot after pinned topics
                if (!this.state.topics[currTop].isPinned && topNum < currTop) {
                    break;
                }
            }
            dispOrderCopy.splice(i-1, 0, topNum);
        }
        else { // topic gets pinned; push to front of display order
            dispOrderCopy.unshift(topNum);
        }

        // toggle isPinned state of topic and ensure topic is not hidden
        topicsCopy[topNum].isPinned = !topicsCopy[topNum].isPinned;
        topicsCopy[topNum].isHidden = false;
        this.setState({ 
            topics: topicsCopy,
            displayOrder: dispOrderCopy 
        });
    }

    toggleTopicHide = (topNum) => {
        let topicsCopy = {...this.state.topics};

        let dispOrderCopy = [...this.state.displayOrder];
        dispOrderCopy = dispOrderCopy.filter(tn => tn !== topNum);

        if (this.state.topics[topNum].isHidden) { // topic gets unhidden
            let i;
            for (i = dispOrderCopy.length; i > -1; i--) {
                let currTop = this.state.displayOrder[i];
                // should insert unhidden topics after pinned topics
                if (this.state.topics[currTop].isPinned) {
                    break;
                }
                // insert topNum in correct spot before hidden topics
                if (!this.state.topics[currTop].isHidden && currTop < topNum) {
                    break;
                }
            }
            dispOrderCopy.splice(i+1, 0, topNum);
        }
        else { // topic gets hidden; push to end of display order
            dispOrderCopy.push(topNum);
        }

        // toggle isHidden state of topic and ensure topic is not pinned
        topicsCopy[topNum].isHidden = !topicsCopy[topNum].isHidden;
        topicsCopy[topNum].isPinned = false;
        this.setState({ 
            topics: topicsCopy,
            displayOrder: dispOrderCopy 
        });
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
            || (prevProps.topicWordCounts.length === 0 && this.props.topicWordCounts.length > 0)) {
            console.log(this.props.topicWordCounts);
            this.clearAnnotations();
            this.initTopics(this.props.numTopics, this.props.topicWordCounts);
        }

        // after init, if iterations have run creating new topicWordCounts
        // update topWords but do not reinitialize everything
        else if(this.state.topics && prevProps.topicWordCounts !== this.props.topicWordCounts) {
            let topicsCopy = {...this.state.topics};
            console.log(this.topicsCopy);
            for (let topic = 0; topic < this.props.numTopics; topic++) {
                if (this.props.topicWordCounts[topic]) { 
                    topicsCopy[topic].topWords = topNWords(this.props.topicWordCounts[topic], 10);
                }
            }
            this.setState({
                topics: topicsCopy,
            });
        }
    }

    render() {
        const { numTopics, topicWordCounts, changeAnnotation, getAnnotation, selectedTopic } = this.props;
        
        // if (topicWordCounts.length === 0) {
        //     if (this.state.displayOrder.length === 0) {
        //         this.initTopics(this.props.numTopics, this.props.topicWordCounts);
        //     }
        return (
            <div className="sidebar">
                <form id="topic-annotations">
                {
                    this.state.displayOrder.map((topNum, index) => (
                        <div 
                            id="topics" 
                            className="sidebox" 
                            key={index}
                        >
                            {/* Pin and Hide buttons */}
                            <div style={{ 
                                display: "flex", 
                                justifyContent: "flex-end",
                                backgroundColor: "var(--color1)"
                            }}>
                                {/* Pin/Unpin button */}
                                <button
                                    type="button"
                                    onClick={() => this.toggleTopicPin(topNum)}
                                    style={{
                                        border: "none",
                                        backgroundColor: "inherit",
                                        outline: "none",
                                    }}
                                >
                                    { this.state.topics[topNum].isPinned ? 
                                        <PinAngleFill style={{height: "16px", width: "16px"}} />
                                        :
                                        <PinAngle style={{height: "16px", width: "16px"}} />
                                    }
                                </button>
                                
                                {/* Hide/Unhide button */}
                                <button
                                    type="button"
                                    onClick={() => this.toggleTopicHide(topNum)}
                                    style={{
                                        border: "none",
                                        backgroundColor: "inherit",
                                        outline: "none",
                                    }}
                                >
                                    { this.state.topics[topNum].isHidden ? 
                                        <EyeSlashFill style={{height: "16px", width: "16px"}} />
                                        :
                                        <EyeSlash style={{height: "16px", width: "16px"}} />
                                    }
                                </button>
                                
                            </div>

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
                                    height: "30px",
                                    width: "100%",
                                }}
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
                                style={{ color: "inherit" }}
                            >
                                {`[${topNum}] ${this.state.topics[topNum].topWords}`}
                            </div>
                        </div>
                        )
                    )
                }
                </form>
            </div>
        ) // TODO: spinner while topicWordCounts loads
        // } else {
        //     return (
        //         <div className="sidebar">
        //             Loading
        //         </div>
        //     )
        // }
    }
}

export default SideBar;