import React, { Component } from 'react'; 
import PageController from './PageController';
import DocAccordion from './DocAccordion';

/**
 * @summary A page that displays the documents in the model
 */
class TopicDoc extends Component {

    static DOCS_PER_PAGE = 20;
    static DOC_SORT_SMOOTHING = 10.0;

    constructor(props) {
        super (props);
        this.state = {
            currentPage: 1,
            showMetaData: false,
        }
    }

    /**
     * @summary documents sorted in order of the prevalence 
     * of the selected topic
     */
    get sortedDocuments() {
        const selectedTopic = this.props.selectedTopic;
        const sumDocSortSmoothing = TopicDoc.DOC_SORT_SMOOTHING * this.props.numTopics;
        let sortedDocuments = this.props.documents;

        // Return default order if no topic is selected
        if (this.props.selectedTopic === -1) return sortedDocuments;

        sortedDocuments = sortedDocuments.map(function (doc, i) {
            doc["score"] = 
                (doc.topicCounts[selectedTopic] + TopicDoc.DOC_SORT_SMOOTHING)/
                (doc.tokens.length + sumDocSortSmoothing)
            return doc
        });
        sortedDocuments.sort(function(a, b) {
            return b.score - a.score;
        });
        return sortedDocuments;
    }

    get lastPage() {
        return Math.ceil(this.props.documents.length/TopicDoc.DOCS_PER_PAGE);
    }

    get startDoc() {
        return (this.state.currentPage - 1 ) * TopicDoc.DOCS_PER_PAGE
    }

    /**
     * @summary one past the index of the last doc to be displayed
     */
    get endDoc() {
        const endDoc = this.startDoc + TopicDoc.DOCS_PER_PAGE

        // Avoid giving document past the end of documents
        if (endDoc >= this.props.documents.length) {
            return this.props.documents.length;
        }
        return endDoc
    }

    /**
     * @summary changes the current page to n
     * @param {Number} n 
     */
    changePage = (n) => {
        this.setState({
            currentPage: n
        })
    }

    toggleMetaData = () => {
        console.log("Toggled")
        this.setState({
            showMetaData: !this.state.showMetaData
        })
    }

    render() {
        return(
            <div>
                <div className = "docNav">
                <PageController
                    currentPage = {this.state.currentPage}
                    changePage = {this.changePage}
                    lastPage = {this.lastPage}
                />
                {this.toggleMetaDataButton()}
                </div>

                <DocAccordion
                    documents = {this.sortedDocuments}
                    startDoc = {this.startDoc}
                    endDoc = {this.endDoc}
                    isTopicSelected = {this.props.selectedTopic !== -1}
                    selectedTopic = {this.props.selectedTopic}
                    tokensPerTopic = {this.props.tokensPerTopic}
                    wordTopicCounts = {this.props.wordTopicCounts}
                    highestWordTopicCount = {this.props.highestWordTopicCount}
                    showMetaData = {this.state.showMetaData}
                    topicSaliency = {this.props.topicSaliency}
                    maxTopicSaliency = {this.props.maxTopicSaliency(this.props.selectedTopic)}
                />
            </div>
        )
    }

    toggleMetaDataButton() {
        let message = this.state.showMetaData ? 
            "Hide Metadata" : "Show Metadata";
        return(
            <button type="button" id="metaDataButton" 
            onClick={() => this.toggleMetaData()} className = "lightButton">
                {message}
            
            </button>
        )
    }

}

export default TopicDoc;