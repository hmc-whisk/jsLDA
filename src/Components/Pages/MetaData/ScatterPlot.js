import Plot from './Plot'
import {select, event} from 'd3-selection';
import {scaleLinear} from 'd3-scale'
import {axisLeft, axisBottom} from 'd3-axis'

class ScatterPlot extends Plot {
    createPlot() {
        super.createPlot();
        this.createAxis();
        this.plotPoints();
    }

    circleRadius = 3;
    circleFill = "#00b9c9";

    plotPoints() {
        let node = this._rootNode;
        let dataBox = select(node).select("#dataBox");
        const maxCordinates = this.svgHeight * (1 - this.proportionLabels);
        let xVals = this.data.map((d => d.x));
        let yVals = this.data.map((d => d.y));
        let scaleX = scaleLinear()
            .domain([Math.min(...xVals), Math.max(...xVals)])
            .range([0, maxCordinates]);
        let scaleY = scaleLinear()
            .domain([Math.min(...yVals), Math.max(...yVals)])
            .range([maxCordinates, 0]);

        var Tooltip = select("body")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "fixed")

        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function (d) {
            let y = event.pageY - window.scrollY // Control for scrolling
            Tooltip
                .style("opacity", 1)
                .style("left", (event.pageX + 10) + "px")
                .style("top", y + "px")
                .html("X: " + d.x + "<b>Y: " + d.y + "<b>Label: " + d.label)
            select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        var mousemove = function (d) {
            let y = event.pageY - window.scrollY // Control for scrolling
            Tooltip
                .html("X: " + d.x + "<br>Y: " + d.y + "<br>Label: " + d.label)
                .style("left", (event.pageX + 10) + "px")
                .style("top", y + "px")
        }
        var mouseleave = function (d) {
            Tooltip
                .style("opacity", 0)
                .style("left", "0px")
                .style("top", "0px")
            select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }

        // Plot points
        dataBox.selectAll("circle")
            .data(this.data)
            .enter()
            .append("circle")
            .attr("cy", (d) => scaleY(d.y))
            .attr("cx", (d) => scaleX(d.x))
            .attr("r", this.circleRadius)
            .attr("fill", this.circleFill)
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
    }

    createAxis() {
        const node = this._rootNode;
        const dataBox = select(node).select("#dataBox");
        let xVals = this.data.map((d => d.x));
        let yVals = this.data.map((d => d.y));
        const maxCordinates = this.svgHeight * (1 - this.proportionLabels);

        let scaleX = scaleLinear()
            .domain([Math.min(...xVals), Math.max(...xVals)])
            .range([0, maxCordinates]);
        let scaleY = scaleLinear()
            .domain([Math.min(...yVals), Math.max(...yVals)])
            .range([maxCordinates, 0]);

        var yAxis = axisLeft()
            .scale(scaleY);
        var xAxis = axisBottom()
            .scale(scaleX);

        dataBox.append("g")
            .call(yAxis);
        dataBox.append("g")
            .call(xAxis)
            .style("transform", "translate(0%,100%)");
    }
}

export default ScatterPlot;
