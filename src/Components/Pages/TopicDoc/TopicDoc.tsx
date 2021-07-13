import React, {Component, CSSProperties} from 'react';
import PageController from './PageController';
import DocAccordion from './DocAccordion';
import SearchBox from './SearchBox';
import LabeledToggleButton from 'Components/LabeledToggleButton';
import './topicDoc.css';
import type {LDAModel, SortedLDADocument, LDADocument} from "core";

interface TopicDocProps {
    ldaModel: LDAModel
}

interface TopicDocState {
    currentPage: number,
    showMetaData: boolean,
    useSalience: boolean,
    documents: SortedLDADocument[]
}

/**
 * @summary A page that displays the documents in the model
 */
export class TopicDoc extends Component<TopicDocProps, TopicDocState> {

    static DOCS_PER_PAGE = 20;
    static DOC_SORT_SMOOTHING = 10.0;

    constructor(props: TopicDocProps) {
        super(props);
        this.state = {
            currentPage: 1,
            showMetaData: false,
            useSalience: false,
            documents: this.props.ldaModel.sortedDocuments
        }

        this.search = this.search.bind(this);
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
        if (this.state.documents.length === this.props.ldaModel.sortedDocumentsSalient.length) {
            return this.props.ldaModel.sortedDocumentsSalient
        }
        // else sort this.state.documents by salience and return it
        else {
            let sortedDocuments: SortedLDADocument[] = this.state.documents;
            sortedDocuments.sort(function (a, b) {
                return b.score - a.score;
            });
            return sortedDocuments;
        }

        
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

    /**
     * @summary Finds documents which include the search query as a substring
     * @returns Array of SortedLDADocuments that fit the search query
     */
     search(query: string) {
        let searchResults: SortedLDADocument[] = [];
        let docs = this.props.ldaModel.sortedDocuments;

        for (let i = 0; i < docs.length; i++) {
            let currentID = docs[i].id.toString().toLowerCase();
            let lowerQuery = query.toLowerCase();

            if (currentID.indexOf(lowerQuery) >= 0) {
                searchResults.push(docs[i]);
            }
        }

        this.setState({documents: searchResults});
        // console.log(searchResults);
    }

    render() {
        return (
            <div id="docPage">
                <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5em'}}>
                        <SearchBox model={this.props.ldaModel} search={this.search} />

                        <div style={{display:'flex'}}>
                            {this.toggleMetaDataButton()}
                            {this.toggleSalienceDataButton()}
                        </div>
                    </div>
                    
                    <DocAccordion
                        documents={this.state.useSalience ?
                            this.sortedDocumentsSalient :
                            this.state.documents}
                        ldaModel={this.props.ldaModel}
                        startDoc={this.startDoc}
                        endDoc={this.endDoc}
                        showMetaData={this.state.showMetaData}
                        useSalience={this.state.useSalience}
                    />

                    <div className="docNav">
                        <PageController
                            currentPage={this.state.currentPage}
                            changePage={this.changePage.bind(this)}
                            lastPage={this.lastPage}/>
                    </div>
                </div>
            </div>
        )
    }

    toggleMetaDataButton() {
        return (
            <LabeledToggleButton
                id="toggleMetaData"
                label="Show Metadata"
                style={{
                    borderTopLeftRadius: "4px",
                    borderBottomLeftRadius: "4px",
                    borderRight: "none"
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
                    borderTopRightRadius: "4px",
                    borderBottomRightRadius: "4px"
                }}
                checked={this.state.useSalience}
                onChange={this.toggleSalience.bind(this)}/>
        )
    }

}

export default TopicDoc;
