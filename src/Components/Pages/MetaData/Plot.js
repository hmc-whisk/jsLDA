import React, { Component } from 'react'; 
import * as d3 from 'd3'

class Plot extends Component {
    constructor(props){
        super(props)
        this.createPlot = this.createPlot.bind(this)
    }

    componentDidMount() {
        this.createPlot()
    }

    componentDidUpdate() {
        this.createPlot()
    }

    createPlot() {
        
    }

    render() {
        return (
            <svg ref={node => this.node = node}
                width={this.width} height={this.height}>
            </svg>
        )
    }

    width = 500;
    height = 500;
}

export default Plot;