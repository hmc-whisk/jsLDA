import React, { Component } from 'react'; 
import * as d3 from 'd3';
import {topNWords} from '../../funcs/utilityFunctions';

class TimeSeries extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // Constants for metadata time series views.
            timeSeriesWidth: 600, 
            timeSeriesHeight: 75,
            timeSeriesHeightTopic: 300,
        };
    }
    topicTimeGroups = []


    _setRef(componentNode) {
        this._rootNode = componentNode;
    }
    
    /**
     * @summary Creates skeleton of svg component
     */
    createTimeSVGs () {
        var tsPage = d3.select(this._rootNode);
        // Restart the visualizations
        tsPage.select("svg").remove();
        let temp_topicTimeGroups = [];
        
        let height = this.state.timeSeriesHeight * this.props.numTopics+75
        
        var tsSVG = tsPage
            .append("svg")
            .attr("height", height)
            .attr("width", this.state.timeSeriesWidth);
        
        for (var topic = 0; topic < this.props.numTopics; topic++) {
            temp_topicTimeGroups
                .push(tsSVG
                    .append("g")
                    .attr("transform", "translate(0," + (this.state.timeSeriesHeight * topic) + ")"));
            temp_topicTimeGroups[topic]
                .append("path")
                .style("fill", "#ccc")
                .style("stroke", "#fff");
            temp_topicTimeGroups[topic].append("text").attr("transform", "translate(5,40)");
            temp_topicTimeGroups[topic].append("g");
        }

        this.topicTimeGroups = temp_topicTimeGroups

    }

    /**
     * @summary Creates skeleton of svg component
     */
    createTimeSVGsTopic () {
        var tsPage = d3.select(this._rootNode);
        // Restart the visualizations
        tsPage.select("svg").remove();
        let temp_topicTimeGroups = [];
                
        var tsSVG = tsPage
            .append("svg")
            .attr("height", 600)
            .attr("width", this.state.timeSeriesWidth+200);
        
        temp_topicTimeGroups
            .push(tsSVG
                .append("g")
                .attr("transform", "translate(50,50)"));
        temp_topicTimeGroups[0]
            .append("path")
            .style("fill", "#ccc")
            .style("stroke", "#fff");
        temp_topicTimeGroups[0].append("text").attr("transform", "translate(5,20)");

        this.topicTimeGroups = temp_topicTimeGroups
    }

    /**
     * @summary Updates the info in the timeseries graphs
     */
    timeSeries0() {
        let maxTopicMean = 0;
        let allTopicMeans = []

        for (var topic = 0; topic < this.props.numTopics; topic++) {
            var topicProportions = this.props.documents
                .map(function (d) { 
                    return {
                        date: d.date, 
                        p: d.topicCounts[topic] / d.tokens.length
                    }; 
                });
            var topicMeans = d3
                .nest()
                .key(function (d) {return d.date; })
                .rollup(function (d) {return d3
                    .mean(d, function (x) {return x.p}); })
                .entries(topicProportions);

            let thisMaxTopicMean = Math.max(...topicMeans.map(function (d) {
                return d.value
            }));
            if (thisMaxTopicMean > maxTopicMean) {
                maxTopicMean = thisMaxTopicMean;
            }

            allTopicMeans.push(topicMeans);
        }

        for (var topic = 0; topic < this.props.numTopics; topic++) {
            topicMeans = allTopicMeans[topic];

            var xScale = d3.scaleLinear()
                .domain([0, topicMeans.length])
                .range([0, this.state.timeSeriesWidth]);
            var yScale = d3
                .scaleLinear()
                .domain([0, maxTopicMean])
                .range([this.state.timeSeriesHeight, 0]);

            var scale = d3.scaleLinear()
                .domain([topicMeans[0].key, topicMeans[topicMeans.length-1].key])
                .range([0, this.state.timeSeriesWidth]);

            var area = d3.area()
                .x(function (d, i) { return scale(d.key); })
                .y1(function (d) { return yScale(d.value); })
                .y0(yScale(0));

            var x_axis = d3.axisBottom()
                .scale(scale)
                .tickFormat(d3.format("d"));

            if (this.topicTimeGroups[topic]) {
                this.topicTimeGroups[topic]
                    .select("path")
                    .attr("d", area(topicMeans));
                this.topicTimeGroups[topic]
                    .select("text")
                    .text(topNWords(this.props.topicWordCounts[topic], 3));
                this.topicTimeGroups[topic]
                    .select("g")
                    .attr("transform", "translate(0,75)")
                    .call(x_axis)
            }
        }
    }

    /**
     * @summary Updates the info in the timeseries graphs
     */
    timeSeriesTopic() {
        let maxTopicMean = 0;

        let topic = this.props.selectedTopic;
        var topicProportions = this.props.documents
                .map(function (d) { 
                    return {
                        date: d.date, 
                        p: d.topicCounts[topic] / d.tokens.length
                    }; 
                });
        var topicMeans = d3
            .nest()
            .key(function (d) {return d.date; })
            .rollup(function (d) {return d3
                .mean(d, function (x) {return x.p}); })
            .entries(topicProportions);

        let thisMaxTopicMean = Math.max(...topicMeans.map(function (d) {
            return d.value
        }));
        if (thisMaxTopicMean > maxTopicMean) {
            maxTopicMean = thisMaxTopicMean;
        }

        var xScale = d3.scaleLinear()
            .domain([0, topicMeans.length])
            .range([0, this.state.timeSeriesWidth-50]);
        var yScale = d3
            .scaleLinear()
            .domain([0, maxTopicMean])
            .range([this.state.timeSeriesHeightTopic, 0]);

        var scale = d3.scaleLinear()
            .domain([topicMeans[0].key, topicMeans[topicMeans.length-1].key])
            .range([0, this.state.timeSeriesWidth-50]);

        var area = d3.area()
            .x(function (d, i) { return scale(d.key); })
            .y1(function (d) { return yScale(d.value); })
            .y0(yScale(0));

        var x_axis = d3.axisBottom()
            .scale(scale)
            .tickFormat(d3.format("d"));
        
        var y_axis = d3.axisLeft()
            .scale(yScale);

        if (this.topicTimeGroups[0]) {

            var topicKeys = [];
            for (let i = 0; i < topicMeans.length; i += 1) {
                topicKeys.push(topicMeans[i].key);
            }

            this.topicTimeGroups[0]
                .select("path")
                .attr("d", area(topicMeans));
            this.topicTimeGroups[0]
                .select("text")
                .text(topNWords(this.props.topicWordCounts[topic], 3));
            this.topicTimeGroups[0]
                .append("g")
                .attr("transform", "translate(0," + this.state.timeSeriesHeightTopic + ")")
                .call(x_axis)
            this.topicTimeGroups[0]
                .append("g")
                .call(y_axis)
            this.topicTimeGroups[0]
                .append("text")
                .style("text-anchor", "middle")
                .attr("transform", "translate(-10,-10)")
                .text("Proportion")
                .attr("font-weight", 'bold');;      
            
            this.topicTimeGroups[0]
                .append("text")
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + (this.state.timeSeriesWidth/2-20)+ "," + (this.state.timeSeriesHeightTopic+ 40 )+ ")")
                .text("Time")
                .attr("font-weight", 'bold');;    

            var focus = this.topicTimeGroups[0].append("g")
                .attr("class", "focus")
                .style("display", "none");
    
            focus.append("circle")
                .attr("fill", "steelblue")
                .attr("r", 5);
    
            focus.append("rect")
                .attr("class", "tooltip")
                .attr("width", 150)
                .attr("height", 50)
                .attr("x", 10)
                .attr("y", -22)
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("fill", 'white')
                .attr("stroke", '#000');    
    
            focus.append("text")
                .attr("class", "tooltip-year")
                .attr("x", 65)
                .attr("y", -5)
                .attr("font-weight", 'bold');

            focus.append("text")
                .attr("x", 18)
                .attr("y", 18)
                .attr("font-size", '14px')
                .text("Proportion:");
    
            focus.append("text")
                .attr("class", "tooltip-prop")
                .attr("x", 95)
                .attr("y", 18)
                .attr("font-weight", 'bold');
            this.topicTimeGroups[0].append("rect")
                .attr("class", "overlay")
                .attr("fill", 'none')
                .attr('pointer-events', 'all')
                .attr("width", this.state.timeSeriesWidth-55)
                .attr("height", 300)
                .on("mouseover", function() { focus.style("display", null); })
                .on("mouseout", function() { focus.style("display", "none"); })
                .on("mousemove", function() {
                    if (d3.mouse(this)[0] > 0) {
                    let x0 = scale.invert(d3.mouse(this)[0]),
                    i = d3.bisectLeft(topicKeys, x0),
                    d0 = topicMeans[i - 1],
                    d1 = topicMeans[i],
                    d = x0 - d0.key > d1.key - x0 ? d1 : d0;
                    focus.attr("transform", "translate(" + scale(d.key) + "," + yScale(d.value) + ")");
                    focus.select(".tooltip-year").text(d.key);
                    focus.select(".tooltip-prop").text(d.value.toPrecision(4));}
                });
        }
        
    }
  
    componentDidMount() {
        if (this.props.selectedTopic == -1) {
            this.createTimeSVGs();
            this.timeSeries0()
        }
        else {
            this.createTimeSVGsTopic();
            this.timeSeriesTopic()
        }
    }

    componentDidUpdate(prevProps) {
        if(prevProps.numTopics !== this.props.numTopics) {
            this.createTimeSVGs();
        }
        if (this.props.selectedTopic == -1) {
            this.createTimeSVGs();
            this.timeSeries0()
        }
        else {
            this.createTimeSVGsTopic();
            this.timeSeriesTopic()
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.update === false) {
            return false
        }
        return true
    }

    render() {
        return (
            <div id="ts-page" className="page" ref={this._setRef.bind(this)}>
                <div className="help">Documents are grouped by their "date" field (the second column in the input file). These plots show the average document proportion of each topic at each date value. Date values are <i>not</i> parsed, but simply sorted in the order they appear in the input file.
                Hover only shows the time fields that are filled. Two consective time periods present in the data are connected with a straight line.</div>
                <div className="help"></div>
            </div>        
        )
    }
}

export default TimeSeries



