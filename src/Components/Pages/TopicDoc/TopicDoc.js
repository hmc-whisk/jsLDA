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
            useSalience: false
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

    /**
     * @summary documents sorted in order of the saliency score of documents
     */
    get sortedDocumentsSalient() {
        let sortedDocuments = this.props.documents;
        let getWordTopicValue = this.getWordTopicValue;
        // Return default order if no topic is selected
        if (this.props.selectedTopic === -1) return sortedDocuments;

        sortedDocuments = sortedDocuments.map(function (doc, i) {
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
        let salience = this.props.topicSaliency(w,this.props.selectedTopic);
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

    /**
     * @summary Toggles option to show meta data of documents
     */
    toggleMetaData = () => {
        this.setState({
            showMetaData: !this.state.showMetaData
        })
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
                <div className="docNav">
                <PageController
                    currentPage = {this.state.currentPage}
                    changePage = {this.changePage}
                    lastPage = {this.lastPage}
                />
                {this.toggleSalienceDataButton()}
                {this.toggleMetaDataButton()}
                </div>

                <DocAccordion
                    documents = {this.state.useSalience?
                                    this.sortedDocumentsSalient:
                                    this.sortedDocuments}
                    startDoc = {this.startDoc}
                    endDoc = {this.endDoc}
                    isTopicSelected = {this.props.selectedTopic !== -1}
                    selectedTopic = {this.props.selectedTopic}
                    tokensPerTopic = {this.props.tokensPerTopic}
                    wordTopicCounts = {this.props.wordTopicCounts}
                    highestWordTopicCount = {this.props.highestWordTopicCount}
                    showMetaData = {this.state.showMetaData}
                    useSalience = {this.state.useSalience}
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

    toggleSalienceDataButton() {
        let message = this.state.useSalience ? 
            "Use Topic Score" : "Use Saliency";
        let buttonstyle = {}
        if (this.state.showMetaData) {
            buttonstyle = {
            border: 'solid #ddd 2px',
            margin:'0 2px 0 0',
            padding:'7px 10px',
            display:'block',
            float:'right',
            fontSize : '1em',
            color:'#333',
            WebkitUserSelect:'none',
            MozUserSelect:'none',
            userSelect: 'none',
            MozBorderRadius: '4px',
            borderRadius: '4px',
            background: '#ddd',
            cursor:'pointer'}
        }
        else {
            buttonstyle = {
            border: 'solid #ddd 2px',
            margin:'0 2px 0 0',
            padding:'7px 10px',
            display:'block',
            float: 'right',
            fontSize : '1em',
            color:'#333',
            WebkitUserSelect:'none',
            MozUserSelect:'none',
            userSelect: 'none',
            MozBorderRadius: '4px',
            borderRadius: '4px',
            background: '#FFFFFF',
            cursor:'auto'
            }
        }
      
        return(
            <button type="button" id="metaDataButton" 
            onClick={() => this.toggleSalience()} className = "lightButton">
                {message}
            
            </button>
        )
    }

}

export default TopicDoc;