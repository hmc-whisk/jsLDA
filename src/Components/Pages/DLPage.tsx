import React from "react";
import './pages.css';
import type {LDAModelDataDLer} from "core";

/**
 * @summary Component for Download page
 *  @prop modelDataDLer
 */
export class DLPage extends React.Component<{
    modelDataDLer: LDAModelDataDLer
}> {

    render() {
        return (

            <div id="pages">

                <div id="dl-page" className="page">
                    <div className="help">All of the following downloads, except for the model download, are in CSV
                        format. Quotation marks are stripped from words upon download to avoid CSV errors.
                    </div>
                    <ul>
                        <li>{this.modelSaver}</li>
                        <li>{this.docTopics}</li>
                        <li>{this.topicWords}</li>
                        <li>{this.topicSummary}</li>
                        <li>{this.topicPMI}</li>
                        <li>{this.graphFile}</li>
                        <li>{this.stateFile}</li>
                        <li>{this.topicsTime}</li>
                        <li>{this.stopwordsFile}</li>
                    </ul>
                </div>

            </div>

        );
    }

    get modelSaver() {
        let description = "A copy of your current model which you can upload to this website and continue working on."
        return (
            <span>
                <button id="model-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.downloadModel()}>
                    LDA Model
                </button>
                : {description}
            </span>
        )
    }

    get docTopics() {
        let description = "Every topic value for every document."
        return (
            <span>
                <button id="doctopics-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveDocTopics()}>
                    Document Topics
                </button>
                : {description}
            </span>
        )
    }

    get topicWords() {
        let description = "The average topic value for every word type."
        return (
            <span>
                <button id="topicwords-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveTopicWords()}>
                    Topic Words
                </button>
                : {description}
            </span>
        )
    }

    get topicSummary() {
        let description = "The topic number, annotation, token count, and top 10 words for every topic."
        return (
            <span>
                <button id="keys-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveTopicKeys()}>
                    Topic Summaries
                </button>
                : {description}
            </span>
        )
    }

    get topicPMI() {
        let description = "The pointwise mutual information score between every pair of topics."
        return (
            <span>
                <button id="topictopic-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveTopicPMI()}>
                    Topic-Topic Correlations
                </button>
                : {description}
            </span>
        )
    }

    get graphFile() {
        let description = "Formatted to make graphs in Gephi."
        return (
            <span>
                <button id="graph-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveGraph()}>
                    Doc-Topic Graph File
                </button>
                : {description}
            </span>
        )
    }

    get stateFile() {
        let description = "The topic assignment for every token."
        return (
            <span>
                <button id="state-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveState()}>
                    Complete Sampling State
                </button>
                : {description}
            </span>
        )
    }

    get topicsTime() {
        let description = "The proportion of tokens assigned to a topic at every time stamp."
        return (
            <span>
                <button id="topicstime-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.saveTopicsTime()}>
                    Topic Values Over Time
                </button>
                : {description}
            </span>
        )
    }

    get stopwordsFile() {
        let description = "A text file of all the current stopwords with one word per line."
        return (
            <span>
                <button id="stopword-dl" className="darkButton"
                        onClick={() => this.props.modelDataDLer.downloadStopwords()}>
                    Stopwords
                </button>
                : {description}
            </span>
        )
    }
}

export default DLPage;
