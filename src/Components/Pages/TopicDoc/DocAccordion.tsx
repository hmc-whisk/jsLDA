import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import DocCard from './DocCard';
import './topicDoc.css';
import LDAModel, {SortedLDADocument} from "../../../LDAModel/LDAModel";

interface DocAccordionProps{
    documents:SortedLDADocument[],
    ldaModel:LDAModel,
    startDoc:number,
    endDoc:number,
    showMetaData:boolean,
    useSalience:boolean
}
interface DocAccordionState{}

class DocAccordion extends React.Component<DocAccordionProps,DocAccordionState> {

    render() {
        return (
            <div>
                <Accordion defaultActiveKey={this.props.ldaModel.documents[this.props.startDoc].originalOrder.toString()}>
                    {this.props.documents
                        .slice(this.props.startDoc, this.props.endDoc)
                        .map((document) => {
                                return <DocCard
                                    ldaModel={this.props.ldaModel}
                                    document={document}
                                    key={document.originalOrder}
                                    showMetaData={this.props.showMetaData}
                                    maxTopicValue={this.maxTopicValue}
                                    useSalience={this.props.useSalience}
                                />
                            }
                        )}
                </Accordion>
            </div>
        )
    }

    /**
     * The highest saliency of any of the top 1000 words in the selected
     * topic.
     */
    get maxTopicValue() {
        return this.props.ldaModel.maxTopicSaliency(
            this.props.ldaModel.selectedTopic);
    }
}

export default DocAccordion;
