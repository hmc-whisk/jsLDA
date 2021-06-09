import React, {Component} from 'react';
import {select} from 'd3-selection'

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
    proportionLabels = .2

    constructor(props) {
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
        select(node).selectAll("*").remove()

        // Create a box for the data
        select(node)
            .append("svg")
            .attr("width", this.svgWidth - this.svgWidth * this.proportionLabels)
            .attr("height", this.svgHeight - this.svgHeight * this.proportionLabels)
            .attr("x", this.proportionLabels * this.svgHeight)
            .attr("y", 0)
            .attr("overflow", "visible")
            .attr("id", "dataBox")

        // Add Y Label
        select(node).select("#dataBox").append("text")
            .style("transform", "rotate(270deg) translate(-250px,-18%)")
            .text(this.props.yLabel);

        select(node).select("#dataBox").append("text")
            .style("transform", "translate(50%,118%)")
            .text(this.props.xLabel);
    }

    _setRef(componentNode) {
        this._rootNode = componentNode;
    }

    render() {
        let divStyle = {
            width: this.width,
            height: this.height,
            overflowX: "scroll",
            overflowY: "scroll",
        }
        return (
            <>
                <div style={{transform: "translate(5%,0%)"}}>
                    <h3>{this.props.title}</h3>
                </div>
                <div style={divStyle} class={"plot"}>
                    <svg ref={this._setRef.bind(this)}
                         width={this.svgWidth} height={this.svgHeight}
                         overflow={"visible"}>
                    </svg>
                </div>
            </>

        )

    }

    get width() {
        return 700;
    }

    get height() {
        return 700;
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
