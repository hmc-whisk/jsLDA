import React, { Component } from 'react'; 
import { select } from 'd3-selection'

/**
 * @summary This is a basic class for displaying d3 plots
 * @description As is, this plot only prints the data it was
 * passed as a prop. The purpose of this class is for it
 * to be extended by other classes who override the createPlot
 * function to display whatever they desire. The height,
 * and width datafields can also be overridden for custom 
 * plot size
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

    /**
     * @summary draws the plot
     */
    createPlot() {
        this.setupPlot()
    }

    setupPlot() {
        const node = this._rootNode;
        
        // Create a box for the data
        select(node)
            .append("svg")
            .attr("width",this.width-this.width*this.proportionLabels)
            .attr("height",this.height-this.height*this.proportionLabels)
            .attr("x", this.proportionLabels*this.height)
            .attr("y", 0)
            .attr("overflow", "visible")
            .attr("id", "barBox")
    }

    _setRef(componentNode) {
        this._rootNode = componentNode;
    }

    render() {
        let divStyle = {
            width: this.width,
            height: this.height,
            overflowX: "scroll",
            overflowY: "hidden",
        }
        return (
            <div style = {divStyle}>
                <svg ref={this._setRef.bind(this)}
                    width={this.svgWidth} height={this.svgHeight}
                    overflow={"visible"}>
                </svg>
            </div>

        )
        
    }

    get width() {
        return 500;
    }

    get height() {
        return 500;
    }

    get svgWidth() {
        return 500;
    }

    get svgHeight() {
        return 500;
    }

    /**
     * @summary the data to draw the graph with
     */
    get data() {
        return this.props.data
    }
}

export default Plot;