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
        this.createAxis()
    }

    axisLineStyle = "stroke: #ddd; stroke-width: 2px"
    xLabel = "Some Value"
    yLabel = "Some Value"

    createAxis() {
        const node = this._rootNode;
        // Create x axis line
        select(node)
            .append("line")
            .attr("x1",this.width*this.proportionLabels)
            .attr("y1",0)
            .attr("x2",this.width*this.proportionLabels)
            .attr("y2",this.height - this.height*this.proportionLabels)
            .attr("style",this.axisLineStyle)
        // Create y axis line
        select(node)
            .append("line")
            .attr("x1",this.width)
            .attr("y1",this.height-this.height*this.proportionLabels)
            .attr("x2",this.width*this.proportionLabels)
            .attr("y2",this.height - this.height*this.proportionLabels)
            .attr("style",this.axisLineStyle)
        
        // Create a box for the bars
        select(node)
            .append("svg")
            .attr("width",this.width-this.width*this.proportionLabels)
            .attr("height",this.height-this.height*this.proportionLabels)
            .attr("x", this.proportionLabels*this.height)
            .attr("y", 0)
            .attr("overflow", "visible")
            .attr("id", "barBox")
        
        // Add a x label
        select(node)
            .append("text")
            .text(this.xLabel)
            .attr("x","50%")
            .attr("y",100*(1-this.proportionLabels)+5+"%")

        // Add a y label
        select(node)
            .append("text")
            .text(this.yLabel)
            .attr("transform","rotate(-90)")
            .attr("x","-50%")
            .attr("y","10%")
            .text(this.yLabel)
    }

    _setRef(componentNode) {
        this._rootNode = componentNode;
    }

    render() {
        return (
            <svg ref={this._setRef.bind(this)}
                width={this.width} height={this.height}
                overflow={"auto"}>
            </svg>
        )
        
    }

    get width() {
        return 500;
    }

    get height() {
        return 500;
    }

    get data() {
        return this.props.data
    }
}

export default Plot;