import React from 'react'; 
import Accordion from 'react-bootstrap/Accordion'
import DocCard from './DocCard'

class DocAccordion extends React.Component {
    render() {
        return (
            <Accordion defaultActiveKey={this.props.documents[this.props.startDoc].originalOrder}>
                {this.props.documents
                    .slice(this.props.startDoc,this.props.endDoc)
                    .map( (document) => {
                        return <DocCard 
                            document = {document}
                            isTopicSelected = {this.props.isTopicSelected}
                            key = {document.originalOrder}
                            tokensPerTopic = {this.props.tokensPerTopic}
                            wordTopicCounts = {this.props.wordTopicCounts}
                            selectedTopic={this.props.selectedTopic}
                            highestWordTopicCount = {this.props.highestWordTopicCount}
                            showMetaData = {this.props.showMetaData}
                            topicSaliency = {this.props.topicSaliency}
                        />
                    }
                )}
            </Accordion>
        )
    }
}

export default DocAccordion;