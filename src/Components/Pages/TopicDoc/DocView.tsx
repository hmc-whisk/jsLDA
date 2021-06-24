import React, {CSSProperties, ReactElement} from 'react';
import Card from 'react-bootstrap/Card'
import * as d3 from 'd3';
import type {LDAModel, SortedLDADocument} from "core";

interface DocViewProps {
    document: SortedLDADocument,
    ldaModel: LDAModel,
    maxTopicValue: number
}

interface DocViewState {
}

/**
 * @todo finish writing this class to highlight text
 * based on topic values
 */
export class DocView extends React.Component<DocViewProps, DocViewState> {
    static minHighlight = getComputedStyle(document.documentElement).getPropertyValue('--color6');
    static maxHighlight = getComputedStyle(document.documentElement).getPropertyValue('--color2');

    render() {
        return (
            <Card.Body>{this.highlightedText}</Card.Body>
        )
    }

    /**
     * @summary The text of the document formatted with topic highlighting
     */
    get highlightedText(): ReactElement {
        const topic = this.props.ldaModel.selectedTopic;
        const originalText = this.props.document.originalText;

        if (topic === -1) return <div>{originalText}</div>; // No topic selected

        // don't highlight words when no iterations have been trained
        if (this.props.ldaModel.scheduler.totalCompletedSweeps === 0) return <div>{originalText}</div>;

        const tokens = this.props.ldaModel.textToTokenSaliences(originalText, topic)

        // If no tokens found, just return text
        if (tokens.length === 0) return <div>{originalText}</div>;

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
     * @summary Formats a word in jsx with its topic value highlighting
     * @param {String} w the word to add highlighting to
     * @param {Number} value salience
     * @param key The key to be used in the element
     */
    highlightWord(w: string, value: number, key: number): ReactElement {
        if (value > 0){
        return (
            <span key={key} style={this.getComputedStyle(value)}>{w}</span>
        )
        }
        else {
            return (
                <span key={key}>{w}</span>
            )
        }
    }

    /**
     * @summary Creates a style object for w
     * @param {Number} value Value to be generate styling for
     */
    getComputedStyle(value: number): CSSProperties {
        let colorScale = d3.scaleLinear<string>().domain([0, this.props.maxTopicValue])
            .range([DocView.minHighlight, DocView.maxHighlight]);
        return {backgroundColor: colorScale(value)}
    }
}

export default DocView;
