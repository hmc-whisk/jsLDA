import React from 'react'; 
import Card from 'react-bootstrap/Card'
import * as d3 from 'd3';

/**
 * @todo finish writing this class to highlight text
 * based on topic values
 */
class DocView extends React.Component {
    static minHighlight = "#ffffff"
    static maxHighlight = "#4f9eff"

    render() {
        return(
            <Card.Body>{this.highlightedText}</Card.Body>
        )
    }

    /**
     * @summary The text of the document formatted with topic highlighting
     */
    get highlightedText() {
        if(this.props.selectedTopic===-1) return this.props.document.originalText;
        let words = this.props.document.originalText.split(" ");
        let highlightedWords = words.map((word,i) => this.highlightWord(word,i))
        return highlightedWords;
    }

    /**
     * @summary makes a word only lowercase letters
     * @param {String} w word to strip
     */
    stripWord(w) {
        w = w.toLocaleLowerCase();
        w = w.replace(/[^a-zA-Z]/g,"");
        return w;
    }

    /**
     * @summary Formats a word in jsx with it's topic value highlighting
     * @param {String} w the word to add highlighting to
     * @param key The key to be used in the element
     */
    highlightWord(w, key) {
        return(
            <span key = {key} style={this.getComputedStyle(w)}>{w + " "}</span>
        )
    }

    /**
     * @summary Creates a style object for w
     * @param {String} w Word to be generate styling for
     */
    getComputedStyle(w) {
        let colorScale = d3.scaleLinear().domain([0, this.maxTopicValue])
            .range([DocView.minHighlight, DocView.maxHighlight]);
        return {backgroundColor: colorScale(this.getWordTopicValue(w))}
    }

    /**
     * @summary returns a number indicating the prevalence 
     * of w in the selected topic
     * @param {String} w Word to get topic value of
     */
    getWordTopicValue(w) {
        w = this.stripWord(w);
        if(!this.props.wordTopicCounts[w]) return 0; // If word isn't token
        const numTopicWords = this.props.wordTopicCounts[w][this.props.selectedTopic];
        if(!numTopicWords) return 0; // If word isn't assigned to topic
        // Return proportion of topic explained by word
        return numTopicWords/this.props.tokensPerTopic[this.props.selectedTopic];
    }

    get maxTopicValue() {
        return this.props.highestWordTopicCount/this.props.tokensPerTopic[this.props.selectedTopic];
    }

}

export default DocView;