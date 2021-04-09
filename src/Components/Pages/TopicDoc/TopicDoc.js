import React, { Component } from 'react'; 
import PageController from './PageController';
import DocAccordion from './DocAccordion';
import LabeledToggleButton from '../../LabeledToggleButton';

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

    toggleMetaData = () => {
        this.setState({showMetaData: !this.state.showMetaData})
    }

    render() {
        return(
            <div>
                <LabeledToggleButton 
                    label= {"Show Metadata"}
                    style = {{
                                float:"right",
                            }}
                    checked = {this.state.showMetaData}
                    onChange = {this.toggleMetaData}/>

                <div className = "docNav">
                <PageController
                    currentPage = {this.state.currentPage}
                    changePage = {this.changePage}
                    lastPage = {this.lastPage}/>
                </div>

                <DocAccordion
                    ldaModel = {this.props.ldaModel}
                    startDoc = {this.startDoc}
                    endDoc = {this.endDoc}
                    showMetaData = {this.state.showMetaData}/>
            </div>
        )
    }

}

export default TopicDoc;