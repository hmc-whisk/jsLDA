import React, { Component } from 'react'; 
import PageController from './PageController';
import DocAccordion from './DocAccordion';
import LabeledToggleButton from '../../LabeledToggleButton';
import './topicDoc.css';

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
            useSalience: false
        }
    }

    /**
     * @summary documents sorted in order of the prevalence 
     * of the selected topic
     */
    get sortedDocuments() {
        const selectedTopic = this.props.ldaModel.selectedTopic;
        const sumDocSortSmoothing = TopicDoc.DOC_SORT_SMOOTHING * this.props.ldaModel.numTopics;
        let sortedDocuments = this.props.ldaModel.documents;

        // Return default order if no topic is selected
        if (this.props.ldaModel.selectedTopic === -1) return sortedDocuments;

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

    /**
     * @summary documents sorted in order of the saliency score of documents
     */
    get sortedDocumentsSalient() {
        let sortedDocuments = this.props.ldaModel.documents;
        let getWordTopicValue = this.getWordTopicValue;
        // Return default order if no topic is selected
        if (this.props.ldaModel.selectedTopic === -1) return sortedDocuments;

        sortedDocuments = sortedDocuments.map(function (doc) {
            let words = doc.originalText.split(" ");
            let sal = words.map((word) => getWordTopicValue(word));
            let total = sal.length;
            let totsaliency = sal.reduce((a, b) => a + b, 0);
            doc["score"] = totsaliency/total;
            return doc;
        });
        sortedDocuments.sort(function(a, b) {
            return b.score - a.score;
        });
        return sortedDocuments;
    }


    /**
     * @summary returns a number indicating the prevalence 
     * of w in the selected topic
     * @param {String} w Word to get topic value of
     */
    getWordTopicValue = (w) => {
        w = this.stripWord(w);
        let salience = this.props.ldaModel.topicSaliency(w,this.props.ldaModel.selectedTopic);
        if(salience < 0) {salience = 0};
        return salience;
    }

    /**
     * @summary makes a word only lowercase letters
     * @param {String} w word to strip
     */
    stripWord = (w) => {
        w = w.toLocaleLowerCase();
        w = w.replace(/[^a-zA-Z]/g,"");
        return w;
    }

    get lastPage() {
        return Math.ceil(this.props.ldaModel.documents.length/TopicDoc.DOCS_PER_PAGE);
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
        if (endDoc >= this.props.ldaModel.documents.length) {
            return this.props.ldaModel.documents.length;
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

    /**
     * @summary Toggles option to show meta data of documents
     */
    toggleMetaData = () => {
        this.setState({showMetaData: !this.state.showMetaData})
    }

    /**
     * @summary Toggles option to sort by salinence score
     */
    toggleSalience = () => {
        this.setState({
            useSalience: !this.state.useSalience
        })
    }

    render() {
        return(
            <div>

                {this.toggleMetaDataButton()}
                {this.toggleSalienceDataButton()}
                
                <div className = "docNav">
                <PageController
                    currentPage = {this.state.currentPage}
                    changePage = {this.changePage}
                    lastPage = {this.lastPage}/>
                </div>
                    

                <DocAccordion
                    documents = {this.state.useSalience?
                                    this.sortedDocumentsSalient:
                                    this.sortedDocuments}
                    ldaModel = {this.props.ldaModel}
                    startDoc = {this.startDoc}
                    endDoc = {this.endDoc}
                    showMetaData = {this.state.showMetaData}
                    useSalience = {this.state.useSalience}
                />
            </div>
        )
    }

    toggleMetaDataButton() {
        return(
            <LabeledToggleButton 
                label= {"Show Metadata"}
                style = {{
                            float:"right",
                            borderTopRightRadius: "4px",
                        }}
                checked = {this.state.showMetaData}
                onChange = {this.toggleMetaData}/>
        )
    }

    toggleSalienceDataButton() {
        return(
            <LabeledToggleButton 
                label= {"Sort by Saliency"}
                style = {{
                            float:"right",
                        }}
                checked = {this.state.useSalience}
                onChange = {this.toggleSalience}/>
        )
    }

}

export default TopicDoc;