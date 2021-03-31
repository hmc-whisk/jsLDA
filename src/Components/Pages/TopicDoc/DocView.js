import React from 'react'; 
import Card from 'react-bootstrap/Card'
import * as d3 from 'd3';

/**
 * @todo finish writing this class to highlight text
 * based on topic values
 */
class DocView extends React.Component {
    static minHighlight = getComputedStyle(document.documentElement).getPropertyValue('--color3');
    static maxHighlight = getComputedStyle(document.documentElement).getPropertyValue('--color2');

    render() {
        return(
            <Card.Body>{this.highlightedText}</Card.Body>
        )
    }

    /**
     * @summary The text of the document formatted with topic highlighting
     */
    get highlightedText() {
        if(this.props.ldaModel.selectedTopic===-1) return this.props.document.originalText;
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
        let colorScale = d3.scaleLinear().domain([0, this.props.maxTopicValue])
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
        let salience = this.props.ldaModel.topicSaliency(w,this.props.ldaModel.selectedTopic);
        if(salience < 0) {salience = 0};
        return salience;
    }

}

export default DocView;