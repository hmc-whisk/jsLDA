import React from 'react'; 
import Card from 'react-bootstrap/Card'
import Accordion from 'react-bootstrap/Accordion'
import {format as d3Format} from 'd3';

class DocCard extends React.Component {
    render() {
        const format = d3Format(".2g");
        const document = this.props.document;
        return(
            <Card>
                <Accordion.Toggle as={Card.Header} eventKey={document.originalOrder}>
                    <b>ID: </b>{document.id} 
                    <span style={{float:"right"}}>
                        <b> Topic Score: </b>
                        {this.props.isTopicSelected ? 
                            format(document.score * 100): 
                            "No topic selected"}
                    </span>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={document.originalOrder}>
                    <Card.Body>{document.originalText}</Card.Body>
                </Accordion.Collapse>
            </Card>
        )
    }

    get metaInfo() {
        
    }
}

export default DocCard;