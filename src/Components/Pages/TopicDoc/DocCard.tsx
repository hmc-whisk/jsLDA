import React, {ReactElement} from 'react';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import {format as d3Format} from 'd3';
import {truncate} from 'funcs/utilityFunctions';
import DocView from './DocView';
import DocTreeMap from './DocTreeMap';
import './topicDoc.css';
import type {LDAModel, SortedLDADocument} from "core";

interface DocCardProps{
    ldaModel:LDAModel,
    document:SortedLDADocument,
    key:number,
    showMetaData:boolean,
    maxTopicValue:number,
    useSalience:boolean
}
interface DocCardState{}


export class DocCard extends React.Component<DocCardProps,DocCardState> {
    render() {
        const document = this.props.document;
        return (
            <Card>
                <Accordion.Toggle as={Card.Header} eventKey={document.id.toString()}>
                    <b>ID: </b>{document.id}
                    <span style={{float: "right"}}>
                        {this.props.useSalience ?
                            <b> Saliency Score: </b> :
                            <b> Topic Score: </b>}
                        {this.props.ldaModel.selectedTopic !== -1 ?
                            this.score(document) :
                            "No topic selected"}
                    </span>
                    <div>{this.metaInfo}</div>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={document.id.toString()}>
                    <span>
                        <div className="preview">{truncate(document.originalText, 100)}</div>
                        <DocView
                            document={this.props.document}
                            ldaModel={this.props.ldaModel}
                            maxTopicValue={this.props.maxTopicValue}
                        />
                        <div style ={{margin:'10 0 5 0'}}>
                            <DocTreeMap
                                ldaModel={this.props.ldaModel}
                                document={this.props.document}
                            />
                        </div>
                    </span>
                </Accordion.Collapse>
            </Card>
        )
    }

    /**
     * @summary Metadata info from document in displayable jsx form
     */
    get metaInfo() {
        if (!this.props.showMetaData) return null;
        const document = this.props.document;
        let metaInfo = [this.formatInfo("Date", document.date)]
        for (const [key, value] of Object.entries(document.metadata)) {
            metaInfo.push(this.formatInfo(key, value))
        }
        return metaInfo;
    }

    /**
     * @summary Formats the document score, based on salience score vs topic score
     */
    score(document:SortedLDADocument):string {
        const format = d3Format(".2g");
        return this.props.useSalience ?
            format(document.score) :
            format(document.score * 100);
    }

    formatInfo(key:string, value:string):ReactElement {
        return (
            <div key={key} style={{}}>
                <b>{key}: </b> {value + "  "}
            </div>
        )
    }
}

export default DocCard;
