import React, { Component } from 'react'; 
import OrderedBarPlot from './OrderedBarPlot'
import SortedBarPlot from './SortedBarPlot'
import BarPlot from './BarPlot'
import ScatterPlot from './ScatterPlot'

class MetaData extends Component {
    plots = [
        {
            element: this.orderedBarPlot,
            name: "Ordered Bar Plot",
        },
        {
            element: this.sortedBarPlot,
            name: "Sorted Bar Plot",
        },
        {
            element: this.topicBarPlot,
            name:"Topic Bar Plot",
        },
        {
            element: this.scatterPlot,
            name: "Scatter Plot",
        }
    ]

    constructor(props) {
        super(props);
        this.state = {
            plotType: "Ordered Bar Plot"
        }
    }

    render() {
        return(
            <div id="meta-page">
                {this.plotOptions}
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

    get plotOptions() {
        return (
            <form id = {"plot-options"} onSubmit={this.handleSubmit}>
                <label for="plotChooser">Choose a plot:</label>
                <select name="plotChooser">
                    {this.plots.map((plot => {
                        return <option key = {plot.name} value = {plot}>
                            {plot.name}
                        </option>
                    }))}
                </select>

                <label for="metaChooser">Choose a metadata field:</label>
                <select name="metaChooser">

                </select>
                <input type="submit" value="Render Plot"/>
            </form>
        )
    }
}

export default MetaData;