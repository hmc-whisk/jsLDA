import React from 'react'; 
import Card from 'react-bootstrap/Card'
import Accordion from 'react-bootstrap/Accordion'
import {format as d3Format} from 'd3';
import {truncate} from '../../../funcs/utilityFunctions'
import DocView from './DocView'

class DocCard extends React.Component {
    render() {
        const format = d3Format(".2g");

        const document = this.props.document;
        return(
            <Card>
                <Accordion.Toggle as={Card.Header} eventKey={document.originalOrder}>
                    <b>ID: </b>{document.id} 
                    <span style={{float:"right"}}>
                        { this.props.useSalience?
                            <b> Saliency Score: </b>:
                            <b> Topic Score: </b>}
                        {this.props.isTopicSelected ? 
                            this.score(document): 
                            "No topic selected"}
                    </span>
                    <div>{this.metaInfo}</div>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={document.originalOrder}>
                    <span>
                        <div class={"preview"}>{truncate(document.originalText,100)}</div>
                        <DocView 
                            document = {this.props.document}
                            tokensPerTopic = {this.props.tokensPerTopic}
                            wordTopicCounts = {this.props.wordTopicCounts}
                            selectedTopic = {this.props.selectedTopic}
                            highestWordTopicCount = {this.props.highestWordTopicCount}
                            topicSaliency = {this.props.topicSaliency}
                            maxTopicSaliency = {this.props.maxTopicSaliency}
                        />
                    </span>
                </Accordion.Collapse>
            </Card>
        )
    }

    /**
     * @summary Metadata info from document in displayable jsx form
     */
    get metaInfo() {
        if(!this.props.showMetaData) return null;
        const document = this.props.document;
        let metaInfo = [this.formatInfo("Date",document.date)]
        for (const [key, value] of Object.entries(document.metadata)) {
            metaInfo.push(this.formatInfo(key,value))
        }
        return metaInfo;
    }

    score(document) {
        const format = d3Format(".2g");
        let score = this.props.useSalience?
            format(document.score):
            format(document.score * 100);
        return score;
    }

    formatInfo(key,value){
        return (
            <div key={key} style={{}}>
                <b>{key}: </b> {value + "  "}
            </div>
        )
    }
}

export default DocCard;