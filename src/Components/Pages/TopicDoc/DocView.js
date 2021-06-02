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
        return (
            <Card.Body>{this.highlightedText}</Card.Body>
        )
    }

    /**
     * @summary The text of the document formatted with topic highlighting
     */
    get highlightedText() {
        const topic = this.props.ldaModel.selectedTopic;
        const originalText = this.props.document.originalText;

        if (topic === -1) return originalText; // No topic selected

        const tokens = this.props.ldaModel.textToTokenSaliences(originalText, topic)

        // If no tokens found, just return text
        if (tokens.length === 0) return originalText;

        return <>
            {/* highlighted text before first token */}
            {originalText.slice(0, tokens[0].startIndex)}
            {/* For every token, add highlighted token and
            then add the text between this token and the next */}
            {tokens.map((token, i) => {
                const tokenEndIndex = token.startIndex + token.string.length
                const originalString = originalText.slice(token.startIndex, tokenEndIndex)

                // Next token index or end of originalString if last token
                const nextTokenIndex = i === tokens.length - 1 ?
                    originalText.length :
                    tokens[i + 1].startIndex

                const stringBetweenTokens = originalText.slice(tokenEndIndex, nextTokenIndex)
                return <>
                    {this.highlightWord(originalString, token.salience, i)}
                    {stringBetweenTokens}
                </>
            })}
        </>
    }

    /**
     * @summary Formats a word in jsx with it's topic value highlighting
     * @param {String} w the word to add highlighting to
     * @param {Number} salience the
     * @param key The key to be used in the element
     */
    highlightWord(w, value, key) {
        return (
            <span key={key} style={this.getComputedStyle(value)}>{w}</span>
        )
    }

    /**
     * @summary Creates a style object for w
     * @param {Number} value Value to be generate styling for
     */
    getComputedStyle(value) {
        let colorScale = d3.scaleLinear().domain([0, this.props.maxTopicValue])
            .range([DocView.minHighlight, DocView.maxHighlight]);
        return {backgroundColor: colorScale(value)}
    }
}

export default DocView;
