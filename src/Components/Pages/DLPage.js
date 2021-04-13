import React from "react";
import './pages.css';

/**
 * @summary Component for Download page
 * @requires
 *  @prop modelDataDLer
 */
class DLPage extends React.Component {

    render() {
        return (

            <div id="pages">

                <div id="dl-page" className="page">
                    <div className="help">All of the following downloads, except for the model download, are in CSV format. Quotation marks are stripped from words upon download to avoid CSV errors.</div>
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
            <>
                <button id="model-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.downloadModel()}>
                    LDA Model
                </button>
                : {description}
            </>
        )
    }

    get docTopics() {
        let description = "Every topic value for every document."
        return (
            <>
                <button id="doctopics-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveDocTopics()}>
                    Document Topics
                </button>
                : {description}
            </>
        )
    }

    get topicWords() {
        let description = "The average topic value for every word type."
        return (
            <>
                <button id="topicwords-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveTopicWords()}>
                    Topic Words
                </button>
                : {description}
            </>
        )
    }

    get topicSummary() {
        let description = "The topic number, annotation, token count, and top 10 words for every topic."
        return (
            <>
                <button id="keys-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveTopicKeys()}>
                    Topic Summaries
                </button>
                : {description}
            </>
        )
    }

    get topicPMI() {
        let description = "The pointwise mutual information score between every pair of topics."
        return (
            <>
                <button id="topictopic-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveTopicPMI()}>
                    Topic-Topic Correlations
                </button>
                : {description}
            </>
        )
    }

    get graphFile() {
        let description = "Formatted to make graphs in Gephi."
        return (
            <>
                <button id="graph-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveGraph()}>
                    Doc-Topic Graph File
                </button>
                : {description}
            </>
        )
    }

    get stateFile() {
        let description = "The topic assignment for every token."
        return (
            <>
                <button id="state-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveState()}>
                    Complete Sampling State
                </button>
                : {description}
            </>
        )
    }

    get topicsTime() {
        let description = "The proportion of tokens assigned to a topic at every time stamp."
        return (
            <>
                <button id="topicstime-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.saveTopicsTime()}>
                    Topic Values Over Time
                </button>
                : {description}
            </>
        )
    }

    get stopwordsFile() {
        let description = "A text file of all the current stopwords with one word per line."
        return (
            <>
                <button id="stopword-dl" className="darkButton"
                    onClick={() => this.props.modelDataDLer.downloadStopwords()}>
                    Stopwords
                </button>
                : {description}
            </>
        )
    }
}

export default DLPage;
