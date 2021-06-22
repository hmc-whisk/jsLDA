import React from "react";
import {topNWords} from 'funcs/utilityFunctions';
import TopicDoc from '../TopicDoc/TopicDoc';
import {LDAModel} from 'core'
import './TopicOverview.css';

/**
 * @summary Component for Topic Overview page
 * @requires
 *  @prop ldaModel
 *
 * @author Theo Bayard de Volo
 */

interface TopicOverviewPageProps{
    ldaModel:LDAModel,
    annotations:string[],
    getTopicCorrelations: () => number[][]
}

interface TopicOverviewPageState{}


export class TopicOverviewPage extends React.Component<TopicOverviewPageProps,TopicOverviewPageState> {
    // Some settings
    static numWordsToShow = 50 // Number of topic words in label
    static numDocuments = 20 // Number of documents to display
    static annotationFontSize = 16

    /**
     * Getter used in the display of the most correlated topics using the correlationMatrix from LDAModel
     * @returns the array of topic correlations for the currently selected topic
     */
    get selectedTopicCorrelations(): number[] {
        let correlationMatrix = this.props.getTopicCorrelations();
        let selectedTopicCorrelations = correlationMatrix[this.props.ldaModel.selectedTopic];
        return selectedTopicCorrelations;
    }

    /**
     * Helper function used to display the 3 most correlated topics for a currently selected topic
     * @returns the indices of the 3 largest values in an array of numbers
     * adapted from https://stackoverflow.com/a/11792417
     */
    getMax(ar: number[]): number[] {
        if (ar.length < 3) return [0,1,2];
        let max = [{value: ar[0], index: 0}, {value: ar[1], index: 1}, {value: ar[2], index: 2}];
        max.sort((a,b) => b.value - a.value);
    
        for (let i = 3; i < ar.length; i++) {
            if (ar[i] > max[2].value) {
                max[2].value = ar[i];
                max[2].index = i;
            }
            max.sort((a,b) => b.value - a.value);
        }
        let maxIndices: number[] = max.map(x => x.index);
        return maxIndices;
    }

    render() {

        if (this.props.ldaModel.selectedTopic === -1) {
            return this.noTopicSelected()
        }

        return (
            <div id="pages">
                <div id="to-page" className="page">
                    {this.label()}
                    {/* {this.timeline()}
                    {this.correlations()} */}
                    {this.documents()}
                </div>
            </div>
        )
    }

    /**
     * The element to be displayed on screen if no topic is selected
     */
    noTopicSelected() {
        return (
            <div id="pages">
                <div id="to-page" className="page">
                    <h2 id="label">Please Select a Topic</h2>
                </div>
            </div>
        )
    }

    /**
     * An element that displays the label of the currently displayed topic
     * @returns A JSX element displaying the number, top words,
     * and annotation of a topic
     */
    label() {
        const topicNum = this.props.ldaModel.selectedTopic
        return (
            <div id="label">
                <h2>Topic {topicNum}</h2>
                <pre style={{
                    fontSize: TopicOverviewPage.annotationFontSize,
                    whiteSpace: "pre-wrap"
                }}>
                    <i>{this.props.annotations[topicNum]}</i>
                </pre>
                <p className="subtitle" style={{textAlign: "left"}}>
                    <b>Top Words: </b>
                    {topNWords(this.props.ldaModel.topicWordCounts[topicNum],
                        TopicOverviewPage.numWordsToShow)}

                </p>
                <p className="subtitle" style={{textAlign: "left"}}>
                <b> Most Correlated Topics: </b>
                </p>
                <ul className="no-bullets">
                    {this.getMax(this.selectedTopicCorrelations).map(value => {
                        return <li key={value.toString()} style={{textAlign: "left"}}>
                            <b>Topic {value}: </b>
                            {topNWords(this.props.ldaModel.topicWordCounts[value],
                            TopicOverviewPage.numWordsToShow)}
                            </li>
                    })
                }
                </ul>

            </div>
        )
    }

    /**
     * An element displaying the prevalence of a topic over time
     */
    timeline() {
        return (
            <div className="grid-item" id="timeline"> topic timeline </div>
        )
    }

    /**
     * Returns an element displaying things that are correlated with
     * the currently selected topic
     *
     * For now, only correlations between topics and other topics are
     * shown. In the future, correlations between topics and metadata
     * may be shown as well
     */
    correlations() {
        return (
            <div className="grid-item" id="correlations"> topic correlations </div>
        )
    }

    /**
     * Returns a display of the documents most closely accociated
     * with the selected topic.
     */
    documents() {
        return (
            <div id="documents">
                <h3 style={{float: "left", margin: "10 0 0 0"}}>
                    Documents:
                </h3>
                <TopicDoc
                    ldaModel={this.props.ldaModel}/>
            </div>
        )
    }
}

export default TopicOverviewPage
