import React, {Component, CSSProperties} from 'react';
import PageController from './PageController';
import DocAccordion from './DocAccordion';
import LabeledToggleButton from '../../LabeledToggleButton';
import './topicDoc.css';
import LDAModel, {SortedLDADocument} from "../../../LDAModel/LDAModel";

interface TopicDocProps {
    ldaModel: LDAModel
}

interface TopicDocState {
    currentPage: number,
    showMetaData: boolean,
    useSalience: boolean
}

/**
 * @summary A page that displays the documents in the model
 */
class TopicDoc extends Component<TopicDocProps, TopicDocState> {

    static DOCS_PER_PAGE = 20;
    static DOC_SORT_SMOOTHING = 10.0;

    constructor(props: TopicDocProps) {
        super(props);
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
    get sortedDocuments(): SortedLDADocument[] {
        return this.props.ldaModel.sortedDocuments
    }

    /**
     * @summary documents sorted in order of the saliency score of documents
     */
    get sortedDocumentsSalient(): SortedLDADocument[] {
        return this.props.ldaModel.sortedDocumentsSalient
    }

    get lastPage(): number {
        return Math.ceil(this.props.ldaModel.documents.length / TopicDoc.DOCS_PER_PAGE);
    }

    get startDoc(): number {
        return (this.state.currentPage - 1) * TopicDoc.DOCS_PER_PAGE
    }

    /**
     * @summary one past the index of the last doc to be displayed
     */
    get endDoc(): number {
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
    changePage(n: number) {
        this.setState({
            currentPage: n
        })
    }

    /**
     * @summary Toggles option to show meta data of documents
     */
    toggleMetaData() {
        this.setState({showMetaData: !this.state.showMetaData})
    }

    /**
     * @summary Toggles option to sort by salinence score
     */
    toggleSalience() {
        this.setState({
            useSalience: !this.state.useSalience
        })
    }

    render() {
        return (
            <div>

                {this.toggleMetaDataButton()}
                {this.toggleSalienceDataButton()}

                <div className="docNav">
                    <PageController
                        currentPage={this.state.currentPage}
                        changePage={this.changePage.bind(this)}
                        lastPage={this.lastPage}/>
                </div>


                <DocAccordion
                    documents={this.state.useSalience ?
                        this.sortedDocumentsSalient :
                        this.sortedDocuments}
                    ldaModel={this.props.ldaModel}
                    startDoc={this.startDoc}
                    endDoc={this.endDoc}
                    showMetaData={this.state.showMetaData}
                    useSalience={this.state.useSalience}
                />
            </div>
        )
    }

    toggleMetaDataButton() {
        return (
            <LabeledToggleButton
                id="toggleMetaData"
                label="Show Metadata"
                style={{
                    float: "right",
                    borderTopRightRadius: "4px",
                } as CSSProperties}
                checked={this.state.showMetaData}
                onChange={this.toggleMetaData.bind(this)}/>
        )
    }

    toggleSalienceDataButton() {
        return (
            <LabeledToggleButton
                id="toggleSalience"
                label={"Sort by Saliency"}
                style={{
                    float: "right",
                }}
                checked={this.state.useSalience}
                onChange={this.toggleSalience.bind(this)}/>
        )
    }

}

export default TopicDoc;
