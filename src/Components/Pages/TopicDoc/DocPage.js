import React, {Component} from 'react';
import TopicDoc from './TopicDoc'

class DocPage extends Component {
    render() {
        return (
            <div id={"docPage"}>
                <TopicDoc
                    {...this.props}/>
            </div>
        )
    }
}

export default DocPage
