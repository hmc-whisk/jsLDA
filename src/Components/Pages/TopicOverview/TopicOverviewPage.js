import React from "react";
import {topNWords} from '../../../funcs/utilityFunctions';
import DocAccordion from '../TopicDoc/DocAccordion'

/**
 * @summary Component for Topic Overview page
 * @requires
 *  @prop ldaModel
 * 
 * @author Theo Bayard de Volo
 */
class TopicOverviewPage extends React.Component {
    // Some settings
    numWordsToShow = 50 // Number of topic words in label
    numDocuments = 5 // Number of documents to display



    render() {
        
        if (this.props.ldaModel.selectedTopic == -1) {
            return this.noTopicSelected()
        }

        return (
            <div id="pages">
                <div id="to-page" className="page">
                    {this.label()}
                    {this.timeline()}
                    {this.correlations()}
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
                <i>{this.props.annotations[topicNum]}</i>
                <p class="subtitle">
                    {topNWords(this.props.ldaModel.topicWordCounts[topicNum], 
                        this.numWordsToShow)}
                </p>
            </div>
        )
    }

    /**
     * An element displaying the prevalence of a topic over time
     */
    timeline() {
        return (
            <div class="grid-item" id="timeline"> topic timeline </div>
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
        return(
            <div class="grid-item" id="correlations"> topic correlations </div>
        )
    }

    /**
     * Returns a display of the documents most closely accociated
     * with the selected topic.
     */
    documents() {
        return (
            <div id="documents">
                <DocAccordion
                    ldaModel = {this.props.ldaModel}
                    startDoc = {0}
                    endDoc = {5}
                    showMetaData = {false}/>
            </div>
        )
    }
}

export default TopicOverviewPage