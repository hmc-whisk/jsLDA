import React, { Component } from 'react'; 

class MetaData extends Component {
    render() {
        return(
            <div>
                {this.plotSelector}
                {this.metaDataSelector}
                {this.plot}
            </div>
        )
    }

    get plot() {
        return null
    }

    get plotSelector() {
        return null
    }

    get metaDataSelector() {
        return null
    }
}

export default MetaData;