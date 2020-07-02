import React, { Component } from 'react'; 
import { select } from 'd3-selection'

/**
 * @summary This is a basic class for displaying d3 plots
 * @description As is, this plot only prints the data it was
 * passed as a prop. The purpose of this class is for it
 * to be extended by other classes who override the createPlot
 * function to display whatever they desire. The data, height,
 * and width getter functions can also be overridden for added
 * functionality
 */
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
        const node = this._rootNode;
        select(node)
            .selectAll("text")
            .data(this.data)
            .enter()
            .append("text")
            .text((d) => d)
            .attr("y",(d,i) => i*12)
    }

    _setRef(componentNode) {
        this._rootNode = componentNode;
    }

    render() {
        return (
            <svg ref={this._setRef.bind(this)}
                width={this.width} height={this.height}>
            </svg>
        )
        
    }

    get data() {
        return this.props.data;
    }

    get width() {
        return 500;
    }

    get height() {
        return 500;
    }
}

export default Plot;