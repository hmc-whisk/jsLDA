import React from "react";

/**
 * @summary Component for Topic Overview page
 * @requires
 *  @prop ldaModel
 * 
 * @author Theo Bayard de Volo
 */
class TopicOverviewPage extends React.Component { 
    render() {
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
     * An element that displays the label of the currently displayed topic
     * @returns A JSX element displaying the number, top words,
     * and annotation of a topic
     */
    label() {
        return (
            <div id="label">
                <h2>Topic {this.ldaModel}</h2>
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
            <div class="grid-item"id="documents" > topic documents </div>
        )
    }
}

export default TopicOverviewPage