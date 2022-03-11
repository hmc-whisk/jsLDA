import React, {Component, CSSProperties} from 'react';
import PageController from './PageController';
import DocAccordion from './DocAccordion';
import SearchBox from './SearchBox';
import LabeledToggleButton from 'Components/LabeledToggleButton';
import {LDAModel} from "../../../core/LDAModel";
import './topicDoc.css';
import type {SortedLDADocument} from "core";
import Grid from '@material-ui/core/Grid/Grid';

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
        if (this.state.documents.length === this.props.ldaModel.sortedDocuments.length) {
            return this.props.ldaModel.sortedDocuments
        } else {
            const selectedTopic = this.props.ldaModel.selectedTopic;
            const sumDocSortSmoothing = LDAModel.DOC_SORT_SMOOTHING * this.props.ldaModel.numTopics;

            let sortedDocuments: SortedLDADocument[] = this.state.documents.map(function (doc, i) {
                (doc as SortedLDADocument)["score"] = (doc.topicCounts[selectedTopic] + LDAModel.DOC_SORT_SMOOTHING) /
                    (doc.tokens.length + sumDocSortSmoothing)
                return doc as SortedLDADocument
            });
            sortedDocuments.sort(function (a, b) {
                return b.score - a.score;
            });
            return sortedDocuments;
        }
    }

    /**
     * @summary documents sorted in order of the saliency score of documents
     */
    get sortedDocumentsSalient(): SortedLDADocument[] {
        // If you're returning all documents (i.e. there is no search query)
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
        return Math.ceil(this.state.documents.length / TopicDoc.DOCS_PER_PAGE);
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

    getMetadataKeys() {
        let metadataKeys: string[] = [];
        let docs = this.props.ldaModel.sortedDocuments;

        let currentMetaData = docs[0].metadata;
        for (var key in currentMetaData){
            metadataKeys.push(key);
        }
        return metadataKeys;
    }

    /**
     * @summary Finds documents which include the search query as a substring
     * @returns Array of SortedLDADocuments that fit the search query
     */
     search(query: string, searchKey: string) {
        let searchResults: SortedLDADocument[] = [];
        let docs = this.props.ldaModel.sortedDocuments;
        let lowerQuery = query.toLowerCase();

        if (searchKey === 'id') {
            for (let i = 0; i < docs.length; i++) {
                let currentID = docs[i].id.toString().toLowerCase();
                if (currentID.indexOf(lowerQuery) >= 0) {
                    searchResults.push(docs[i]);
                }
            }
        } else if (searchKey === 'date') {
            for (let i = 0; i < docs.length; i++) {
                let currentDate = docs[i].date;
                if (currentDate.indexOf(lowerQuery) >= 0) {
                    searchResults.push(docs[i]);
                }
            }
        } else if (searchKey === 'text') {
            for (let i = 0; i < docs.length; i++) {
                let lowerCurrentText = docs[i].originalText.toLowerCase();
                if (lowerCurrentText.indexOf(lowerQuery) >= 0) {
                    searchResults.push(docs[i]);
                }
            }
        } else {
            for (let i = 0; i < docs.length; i++) {
                let currentMetaData = docs[i].metadata;
                if (currentMetaData[searchKey].toLowerCase().indexOf(lowerQuery) >= 0) {
                    searchResults.push(docs[i]);
                }
            }
        }
        this.setState({documents: searchResults});
        // console.log(searchResults);
    }

    render() {
        // console.log(this.props.ldaModel.docName)
        return (
            <>
                <div style={{padding: "20px", margin: "0px"}}>
                    All documents within the loaded dataset can be viewed here along with a topic score.
                    You can use the search box to find specific documents by document ID.
                    To reveal more information about each document, you can use the "Show Metadata" toggle.
                </div>
                <div id="docPage">
                    <div>
                        <Grid
                        container
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        style={{marginBottom: '0.5em'}}
                        >
                            <Grid item xs={9}>
                            <SearchBox model={this.props.ldaModel} search={this.search} metadataKeys={this.getMetadataKeys()} changePage={this.changePage.bind(this)}/>
                            </Grid>
                            <Grid item xs={3}>
                            {this.toggleMetaDataButton()}
                            {/* Removing this because it's too slow. [Issue #197] */}
                            {/* {this.toggleSalienceDataButton()} */}
                            </Grid>
                        </Grid>

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

                        <div className="docNav">
                            <PageController
                                currentPage={this.state.currentPage}
                                changePage={this.changePage.bind(this)}
                                lastPage={this.lastPage}/>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    toggleMetaDataButton() {
        return (
            <LabeledToggleButton
                id="toggleMetaData"
                label="Show Metadata"
                style={{
                    borderRadius: "4px",
                    width: "fit-content"
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
