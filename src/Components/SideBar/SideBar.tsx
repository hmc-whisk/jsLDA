import React, {ChangeEvent, Component, SyntheticEvent} from 'react';
import * as d3 from 'd3';
import {logToServer, topNWords} from 'funcs/utilityFunctions';

import {PinAngle, PinAngleFill, EyeSlash, EyeSlashFill} from 'react-bootstrap-icons';
import Spinner from 'react-bootstrap/Spinner';
import './sidebar.css';
import {LDATopicVisibility} from "core";


interface TopicBoxProps {
    topNum: number
    selectedTopic: number
    topicsDict: { [key: number]: string }
    topicVisibility: LDATopicVisibility
    toggleVisibility: (event: SyntheticEvent, topNum: number, toggledButton: string) => void
    toggleTopicDocuments: (topic: number) => void
    changeAnnotation: (text: string, i: number) => void
    annotation: string
}

interface TopicBoxState {
    annotation: string
}

class TopicBox extends Component<TopicBoxProps, TopicBoxState> {

    constructor(props: TopicBoxProps) {
        super(props)
        this.state = {
            annotation: this.props.annotation
        }
    }

    componentDidUpdate(prevProps: Readonly<TopicBoxProps>, prevState: Readonly<TopicBoxState>, snapshot?: any) {
        if (this.props.annotation !== prevProps.annotation)
            this.setState({
                annotation: this.props.annotation
            })
    }

    handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
        this.setState({annotation: e.target.value})
    }

    render() {
        return (
            <div id="topics" className="sidebox">
                {/* Pin and Hide buttons */}
                <div
                    className={ // topicbar color change if selected or hidden
                        (this.props.topNum === this.props.selectedTopic) ?
                        "topicbar topicbar-selected"
                                                                         :
                        (this.props.topicVisibility[this.props.topNum] === "hidden" ?
                         "topicbar topicbar-hidden"
                                                                                    :
                         "topicbar"
                        )
                    }
                    onClick={() => this.props.toggleTopicDocuments(this.props.topNum)}
                >
                    {/* Topic label */}
                    <div style={{color: (this.props.topNum === this.props.selectedTopic) ? "white" : "black"}}>
                        {`Topic ${this.props.topNum}`}
                    </div>

                    {/* Pin/Unpin buttons */}
                    <div>
                        <button
                            type="button"
                            onClick={(e) => this.props.toggleVisibility(e, this.props.topNum, "pin")}
                            className="topic-button"
                        >
                            {this.props.topicVisibility[this.props.topNum] === "pinned" ?
                             <PinAngleFill className="topic-button-icon"/>
                                                                                        :
                             <PinAngle className="topic-button-icon"/>
                            }
                        </button>

                        {/* Hide/Unhide button */}
                        <button
                            type="button"
                            onClick={(e) => this.props.toggleVisibility(e, this.props.topNum, "hide")}
                            className="topic-button"
                        >
                            {this.props.topicVisibility[this.props.topNum] === "hidden" ?
                             <EyeSlashFill className="topic-button-icon"/>
                                                                                        :
                             <EyeSlash className="topic-button-icon"/>
                            }
                        </button>
                    </div>
                </div>

                {/* Annotation text field */}
                <textarea
                    className="textField"
                    style={{
                        whiteSpace: "pre-line",
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
                        if (e.target.value && e.target.value[e.target.value.length - 1] === '\n') {
                            e.target.value = e.target.value.slice(0, -1);
                        }
                        this.props.changeAnnotation(this.state.annotation, this.props.topNum);
                    }}
                    value={this.state.annotation}
                    onChange={this.handleChange.bind(this)}
                />

                {/* List of top words */}
                <div
                    className={(this.props.topNum === this.props.selectedTopic) ? "topicwords selected" : "topicwords"}
                    onClick={() => this.props.toggleTopicDocuments(this.props.topNum)}
                    style={{color: "inherit"}}
                >
                    {this.props.topicsDict[this.props.topNum]}
                </div>
            </div>
        )
    }
}

interface SideBarProps {
    selectedTopic: number
    changeAnnotation: (text: string, i: number) => void
    getAnnotation: (topic: number) => string
    sortVocabByTopic: boolean
    numTopics: number
    topicVisibility: LDATopicVisibility
    setTopicVisibility: (topicNum: number, visibility: "default" | "pinned" | "hidden") => void
    topicWordCounts: { word: string, count: number }[][]
    selectedTopicChange: (topic: number) => void
}

interface SideBarState {
    topicWords: { [key: number]: string }
    displayOrder: number[]
    topicsLoaded: boolean
}

export class SideBar extends Component<SideBarProps, SideBarState> {
    counter: number

    constructor(props: SideBarProps) {
        super(props);
        this.state = {
            topicWords: {},
            displayOrder: [],
            topicsLoaded: false
        };
        this.counter = 0
    }


    // NOTE: kept the d3 implementation of this function because
    // it affects an external element (sortVocabByTopic)
    toggleTopicDocuments(topic: number) {
        if (topic === this.props.selectedTopic) {
            // unselect the topic
            // d3.selectAll("div.topicwords").attr("class", "topicwords");
            //sortVocabByTopic = false;
            d3.select("#sortVocabByTopic").text("Sort by topic")
            this.props.selectedTopicChange(-1);
            logToServer({event: "topic-deselect", topic})
        } else {
            this.props.selectedTopicChange(topic);
            logToServer({event: "topic-select", topic})
        }
    }

    // initialize state with top 10 words for each topic and
    // reset display order
    initTopics(numTops: number, topWordCounts: { word: string, count: number }[][]) {
        if (topWordCounts.length > 0) {
            let topicsDict: { [key: number]: string } = {};
            for (let topic = 0; topic < numTops; topic++) {
                if (topWordCounts[topic]) {
                    topicsDict[topic] = topNWords(this.props.topicWordCounts[topic], 10)
                }
            }
            this.setState({
                topicWords: topicsDict,
                displayOrder: Array.from(Array(numTops).keys()),
                topicsLoaded: true
            });
        }
    }

    // update topic visibility according to UI action with
    // pin/hide buttons
    // also updates topicVisibility in ldaModel
    toggleTopicVisibility(event: SyntheticEvent, topNum: number, toggledButton: string) {
        event.stopPropagation();

        let dispOrderCopy = [...this.state.displayOrder];
        dispOrderCopy = dispOrderCopy.filter(tn => tn !== topNum);

        const currentVis = this.props.topicVisibility[topNum];

        if (toggledButton === "pin") {
            if (currentVis === "pinned") { // unpin
                let i;
                for (i = 0; i < dispOrderCopy.length + 1; i++) {
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
                dispOrderCopy.splice(i - 1, 0, topNum);

                this.props.setTopicVisibility(topNum, "default");
            } else { // pin
                dispOrderCopy.unshift(topNum);

                this.props.setTopicVisibility(topNum, "pinned");
            }
        } else if (toggledButton === "hide") {
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
                dispOrderCopy.splice(i + 1, 0, topNum);

                this.props.setTopicVisibility(topNum, "default")
            } else { // hide
                dispOrderCopy.push(topNum);

                this.props.setTopicVisibility(topNum, "hidden");
            }
        }
        this.setState({displayOrder: dispOrderCopy})
    }

    // When number of topics is changed, model resets and annotations
    // should be cleared
    clearAnnotations() {
        (document.getElementById("topic-annotations") as HTMLFormElement).reset();
        this.counter++
    }

    componentDidMount() {
        this.toggleTopicDocuments(0);
    }

    componentDidUpdate(prevProps: SideBarProps) {
        // if numTopics has changed, should reinitialize topics and clear annotations
        // if topicWordCounts just finished loading, call initTopics
        if (prevProps.numTopics !== this.props.numTopics
            || (prevProps.topicWordCounts.length === 0 && this.props.topicWordCounts.length > 0)) {
            if (this.state.topicsLoaded) { // already initialized once so must clear annotations
                this.clearAnnotations();
                this.setState({topicsLoaded: false})
            }

            this.initTopics(this.props.numTopics, this.props.topicWordCounts);
        }

            // after init, if iterations have run creating new topicWordCounts
        // update topWords but do not reinitialize everything
        else if (this.state.topicWords && prevProps.topicWordCounts !== this.props.topicWordCounts) {
            let topicWordsCopy = {...this.state.topicWords};
            for (let topic = 0; topic < this.props.numTopics; topic++) {
                if (this.props.topicWordCounts[topic]) {
                    topicWordsCopy[topic] = topNWords(this.props.topicWordCounts[topic], 10);
                }
            }
            this.setState({topicWords: topicWordsCopy});
        }
    }

    render() {
        const {changeAnnotation, topicVisibility, selectedTopic} = this.props;
        return (
            this.state.topicsLoaded ?
            <div className="sidebar">
                <form id="topic-annotations">
                    {
                        this.state.displayOrder.map((topNum) => (
                                <TopicBox
                                    key={topNum + "_" + this.counter}
                                    // the counter is used to force all topic boxes to re-render
                                    topNum={topNum}
                                    selectedTopic={selectedTopic}
                                    topicsDict={this.state.topicWords}
                                    topicVisibility={topicVisibility}
                                    toggleVisibility={this.toggleTopicVisibility.bind(this)}
                                    toggleTopicDocuments={this.toggleTopicDocuments.bind(this)}
                                    changeAnnotation={changeAnnotation}
                                    annotation={this.props.getAnnotation(topNum)}
                                />
                            )
                        )
                    }
                </form>
            </div>
                                    :
            <div className="sidebar">
                <Spinner
                    animation="grow"
                    style={{width: "50px", height: "50px", marginLeft: "45%"}}
                    variant="secondary"
                />
            </div>
        )
    }
}

export default SideBar;
