import React from 'react'; 
import Card from 'react-bootstrap/Card'

/**
 * @todo finish writing this class to highlight text
 * based on topic values
 */
class DocView extends React.Component {
    render() {
        <Card.Body>{document.originalText}</Card.Body>
    }

    get highLightedText(){
        words = this.props.document.originalText.split(" ");
    }
}

export default DocView;