import React, { Component } from 'react'; 
import * as d3 from 'd3';

class TimeSeries extends Component {
    constructor(props) {
        super(props);
        this.state = {
            topicTimeGroups: [],
            // Constants for metadata time series views.
            timeSeriesWidth: 500, // used in createTimeSVGs, timeSeries
            timeSeriesHeight: 75, // used in createTimeSVGs, timeSeries
            topNWords: function(wordCounts, n) { 
                return wordCounts.slice(0,n).map((d) => d.word).join(" "); 
            }
        };
    }

    _setRef(componentNode) {
        this._rootNode = componentNode;
    }
    
    // used by ready, changeNumTopics in processing
    createTimeSVGs () {
        var tsPage = d3.select(this._rootNode);
        console.log(tsPage);
        // Restart the visualizations
        tsPage.select("svg").remove();
        let temp_topicTimeGroups = [];
        
        var tsSVG = tsPage
            .append("svg")
            .attr("height", this.state.timeSeriesHeight * this.props.numTopics)
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
            temp_topicTimeGroups[topic].append("text").attr("y", 40);
        }

        this.setState({
            topicTimeGroups: temp_topicTimeGroups
        });
    }

    // used by sweeep in sweep, changeNumTopics in processing
    timeSeries() {
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

            var xScale = d3.scaleLinear()
                .domain([0, topicMeans.length])
                .range([0, this.state.timeSeriesWidth]);
            var yScale = d3
                .scaleLinear()
                .domain([0, 0.2])
                .range([this.state.timeSeriesHeight, 0]);
            var area = d3.area()
                .x(function (d, i) { return xScale(i); })
                .y1(function (d) { return yScale(d.value); })
                .y0(yScale(0));

            if (this.state.topicTimeGroups[topic]) {
                this.state.topicTimeGroups[topic]
                    .select("path")
                    .attr("d", area(topicMeans));
                this.state.topicTimeGroups[topic]
                    .select("text")
                    .text(this.state.topNWords(this.props.topicWordCounts[topic], 3))
            }
        } 
    }
  
    componentDidMount() {
        this.createTimeSVGs();
        this.timeSeries();
    }

    componentDidUpdate() {
        this.timeSeries();
    }

    render() {
        return (
            <div id="ts-page" className="page" ref={this._setRef.bind(this)}>
                <div className="help">Documents are grouped by their "date" field (the second column in the input file). These plots show the average document proportion of each topic at each date value. Date values are <i>not</i> parsed, but simply sorted in the order they appear in the input file.</div>
                <div className="help"></div>
            </div>        
        )
    }
}

// /**
//  * @summary Component for displaying topic time series
//  * 
//  * @requires
//  *  @prop numTopics
//  *  @prop documents
//  *  @prop topicWordCounts
//  */
// class TimeSeries extends Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             // Constants for metadata time series views.
//             timeSeriesWidth: 500, // used in createTimeSVGs, timeSeries
//             timeSeriesHeight: 75, // used in createTimeSVGs, timeSeries
//         };

//     }

//     /**
//      * @summary creates/returns an array of objects with necessary graph info
//      * @returns [topic1Info, topic2Info, ..., topicNInfo] where
//      * topicXInfo = {
//      *  means: [{key: timeKey, value: topicTimeMean}]
//      *  topWords: String of top 3 words
//      * }
//      */
//     getTopicTimeGroups() {
//         let topicTimeGroups = [];

//         for (var topic = 0; topic < this.props.numTopics; topic++) {
//             var topicProportions = this.props.documents
//                 .map(function (d) { 
//                     return {
//                         date: d.date, 
//                         p: d.topicCounts[topic] / d.tokens.length
//                     }; 
//                 });

//             var topicMeans = d3
//                 .nest()
//                 .key(function (d) {return d.date; })
//                 .rollup(function (d) {return d3
//                     .mean(d, function (x) {return x.p}); })
//                 .entries(topicProportions);

//             topicTimeGroups.push({
//                 means: topicMeans,
//                 topWords: this.topNWords(this.props.topicWordCounts[topic],3),
//             })
//         }
//         console.log(topicTimeGroups);
//         return topicTimeGroups;
//     }

//     /**
//      * Returns 
//      */
//     getTopicTimeGraphs() {
//         let topicTimeGroups = this.getTopicTimeGroups();
//     }

//     getTopicTimeGraph(topicTimeGroup) {
        
//     }

//     topNWords(wordCounts, n) { 
//         return wordCounts.slice(0,n).map((d) => d.word).join(" "); 
//     }

//     render() {
//         let topicTimeGraphs = this.getTopicTimeGraphs();

//         return (
//             <div id="ts-page" className="page">
//                 <div className="help">Documents are grouped by their "date" field (the second column in the input file). These plots show the average document proportion of each topic at each date value. Date values are <i>not</i> parsed, but simply sorted in the order they appear in the input file.</div>
//                 <div className="help"></div>
//             </div>        
//         )
//     }
    
// }

export default TimeSeries



