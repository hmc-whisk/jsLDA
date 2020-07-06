import React, { Component } from 'react'; 
import BarPlot from './BarPlot';

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
        return <BarPlot
            data={this.props.documents}
        />
    }

    get plotSelector() {
        return null
    }

    get metaDataSelector() {
        return null
    }
}

export default MetaData;