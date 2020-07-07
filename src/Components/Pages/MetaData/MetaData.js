import React, { Component } from 'react'; 
import BarPlot from './BarPlot';
import OrderedBarPlot from './OrderedBarPlot'

class MetaData extends Component {
    render() {
        return(
            <div id="meta-page">
                {this.plotSelector}
                {this.metaDataSelector}
                {this.plot}
            </div>
        )
    }

    get plot() {
        return <OrderedBarPlot
            //data={this.props.documents}
            data={[{"label": "foo", "value": 1},{"label": "bar", "value": 2.5},{"label": "bar", "value": 10},{"label": "bar", "value": 5},{"label": "bar", "value": 2},{"label": "bar", "value": 2},{"label": "bar", "value": 2},{"label": "bar", "value": 2},{"label": "bar", "value": 2},{"label": "bar", "value": 2},{"label": "bar", "value": 2}]}
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