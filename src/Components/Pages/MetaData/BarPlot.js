import Plot from './Plot'
import { select, mouse, event } from 'd3-selection'
import {scaleLinear} from 'd3-scale'
import {axisLeft, axisBottom} from 'd3-axis'

class BarPlot extends Plot {
    proportionLabels = .2
    barWidth = this.width/8;
    xLabel = null;
    barSeperation = 1.5;
    yTicks = 10;

    // Override Plot's functions to render a plot
    createPlot() {
        super.createPlot();
        this.createBars();
        this.createAxis();
    }

    /**
     * @summary Adds bars, tooltips, and bar labels
     * @prop {Array<{"label":String,"value":Number}>} data 
     * The data to display
     */
    createBars() {
        const data = this.data;
        const node = this._rootNode;
        const barBox = select(node).select("#barBox");
        const maxHeight = this.height * (1 - this.proportionLabels);
        const labels = data.map((d) => d["label"]);
        const values = data.map((d) => d["value"]);
        const barSeperation = this.barSeperation;
        const scaleBars = scaleLinear()
            .domain([0,Math.max(...values)])
            .range([maxHeight,0]);
        
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
        var mouseover = function(d) {
            Tooltip
                .style("opacity", 1)
            select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        var mousemove = function(d) {
            Tooltip
                .html("Value: " + d)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY-5) + "px")
        }
        var mouseleave = function(d) {
            Tooltip
                .style("opacity", 0)
                .style("left", "0px")
                .style("top","0px")
            select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }

        // Create bars
        barBox.selectAll("rect")
            .data(values)
            .enter()
            .append("rect")
            .attr("x", (_,i) => {
                return i*barSeperation*this.barWidth + 0.5*this.barWidth})
            .attr("width", this.barWidth)
            .attr("y", (d) => scaleBars(d))
            .attr("height", (d) => maxHeight-scaleBars(d))
            .attr("class", "plot-bar")
            .style("opacity",0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
        
        // Add labels
        barBox.selectAll("text")
            .data(labels)
            .enter()
            .append("text")
            .text(d => d)
            .attr("transform", (_,i) =>{
                let t = "translate(";
                let x = i*barSeperation*this.barWidth + this.barWidth;
                let y = this.height*(1-this.proportionLabels)+20;
                t += x + "," + y + "),rotate(45)";
                return t;
            })
    }

    createAxis() {
        const data = this.data;
        const node = this._rootNode;
        const barBox = select(node).select("#barBox");
        const values = data.map((d) => d["value"]);

        const scale = scaleLinear()
            .domain([Math.min(...values),Math.max(...values)])
            .range([this.height*(1-this.proportionLabels),0])
        
        var y_axis = axisLeft()
            .scale(scale)

        barBox.append("g")
            .call(y_axis)
    }

    get svgWidth() {
        // Width of bars + width of labels
        return this.data.length*this.barWidth*this.barSeperation+this.height*this.proportionLabels;
    }
}

export default BarPlot;