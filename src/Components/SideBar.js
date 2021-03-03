import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../funcs/utilityFunctions';

import { PinAngle, PinAngleFill, EyeSlash, EyeSlashFill } from 'react-bootstrap-icons';

const TopicBox = ({
    topNum,
    selectedTopic,
    topicsDict,
    topicVisibility,
    toggleVisibility,
    toggleTopicDocuments,
    changeAnnotation,
}) => {
    
    return (
        <div id="topics" className="sidebox">
            {/* Pin and Hide buttons */}
            <div className={ // topbar color change if selected or hidden
                (topNum === selectedTopic) ? 
                    "topicbar topicbar-selected"
                    :
                    (topicVisibility[topNum] === "hidden" ?
                        "topicbar topicbar-hidden"
                        :
                        "topicbar"
                    )
            }>
                {/* Topic label */}
                <div style={{color: (topNum === selectedTopic) ? "white" : "black"}}>
                    {`Topic ${topNum}`}
                </div>

                {/* Pin/Unpin buttons */}
                <div>
                <button
                    type="button"
                    onClick={() => toggleVisibility(topNum, "pin")}
                    style={{
                        border: "none",
                        backgroundColor: "inherit",
                        outline: "none",
                    }}
                >
                    { topicVisibility[topNum] === "pinned" ? 
                        <PinAngleFill style={{height: "16px", width: "16px"}} />
                        :
                        <PinAngle style={{height: "16px", width: "16px"}} />
                    }
                </button>
                
                {/* Hide/Unhide button */}
                <button
                    type="button"
                    onClick={() => toggleVisibility(topNum, "hide")}
                    style={{
                        border: "none",
                        backgroundColor: "inherit",
                        outline: "none",
                    }}
                >
                    { topicVisibility[topNum] === "hidden" ? 
                        <EyeSlashFill style={{height: "16px", width: "16px"}} />
                        :
                        <EyeSlash style={{height: "16px", width: "16px"}} />
                    }
                </button>
                </div>
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
                    resize: "vertical"
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
                onClick={() => toggleTopicDocuments(topNum)}
                style={{ color: "inherit" }}
            >
                {`${topicsDict[topNum]}`}
            </div>
        </div>
    )
}

class SideBar extends Component {

    state = {
        topicWords: null, // {topic#: "string of top words", ...}
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
                    topicsDict[topic] = topNWords(this.props.topicWordCounts[topic], 10)
                }
            }
            this.setState({
                topicWords: topicsDict,
                displayOrder: Array.from(Array(numTops).keys())
            });
        }
    }

    toggleTopicVisibility = (topNum, toggledButton) => {
        let dispOrderCopy = [...this.state.displayOrder];
        dispOrderCopy = dispOrderCopy.filter(tn => tn !== topNum);
        
        const currentVis = this.props.topicVisibility[topNum];

        if (toggledButton === "pin") {
            if (currentVis === "pinned") { // unpin
                let i;
                for (i = 0; i < dispOrderCopy.length+1; i++) {
                    let currTop = this.state.displayOrder[i];
                    // should insert unpinned topics before hidden topics
                    if (this.props.topicVisibility[currTop] === "hidden") {
                        break;
                    }
                    // insert topNum in correct spot after pinned topics
                    if (this.props.topicVisibility[currTop] !== "pinned" && topNum < currTop) {
                        break;
                    }
                }
                dispOrderCopy.splice(i-1, 0, topNum);

                this.props.setTopicVisibility(topNum, "default");
            }
            else { // pin
                dispOrderCopy.unshift(topNum);
                this.props.setTopicVisibility(topNum, "pinned");
            }
        }
        else if (toggledButton === "hide") {
            if (currentVis === "hidden") { // unhide
                let i;
                for (i = dispOrderCopy.length; i > -1; i--) {
                    let currTop = this.state.displayOrder[i];
                    // should insert unhidden topics after pinned topics
                    if (this.props.topicVisibility[currTop] === "pinned") {
                        break;
                    }
                    // insert topNum in correct spot before hidden topics
                    if (this.props.topicVisibility[currTop] !== "hidden" && currTop < topNum) {
                        break;
                    }
                }
                dispOrderCopy.splice(i+1, 0, topNum);
    
                // set topic visibility back to "default" in ldaModel
                this.props.setTopicVisibility(topNum, "default")
            }
            else { // hide
                dispOrderCopy.push(topNum);
                this.props.setTopicVisibility(topNum, "hidden");
            }
        }
        this.setState({ displayOrder: dispOrderCopy })
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
            this.clearAnnotations();
            
            this.initTopics(this.props.numTopics, this.props.topicWordCounts);
        }

        // after init, if iterations have run creating new topicWordCounts
        // update topWords but do not reinitialize everything
        else if(this.state.topicWords && prevProps.topicWordCounts !== this.props.topicWordCounts) {
            let topicWordsCopy = {...this.state.topicWords};
            for (let topic = 0; topic < this.props.numTopics; topic++) {
                if (this.props.topicWordCounts[topic]) { 
                    topicWordsCopy[topic] = topNWords(this.props.topicWordCounts[topic], 10);
                }
            }
            this.setState({ topicWords: topicWordsCopy });
        }
    }

    render() {
        const { changeAnnotation, topicVisibility, selectedTopic } = this.props;

        return (
            <div className="sidebar">
                <form id="topic-annotations">
                {
                    this.state.displayOrder.map((topNum) => (
                        <TopicBox
                            key={topNum}
                            topNum={topNum}
                            selectedTopic={selectedTopic}
                            topicsDict={this.state.topicWords}
                            topicVisibility={topicVisibility}
                            toggleVisibility={this.toggleTopicVisibility}
                            toggleTopicDocuments={this.toggleTopicDocuments}
                            changeAnnotation={changeAnnotation}
                        />
                        )
                    )
                }
                </form>
            </div>
        )
    }
}

export default SideBar;