import * as d3 from 'd3';
import React, { Component } from 'react'; 
import {topNWords} from '../../funcs/utilityFunctions'

/* This function will compute pairwise correlations between topics.
 * Unlike the correlated topic model (CTM) LDA doesn't have parameters
 * that represent topic correlations. But that doesn't mean that topics are
 * not correlated, it just means we have to estimate those values by
 * measuring which topics appear in documents together.
 */

 
class Correlation extends Component {
    constructor(props) {
      super(props);
      this.state = {
        w: 650,
        h: 650,
        // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
        correlationMinTokens: 2,
        correlationMinProportion: 0.05,
      };

    // vis = d3.select("#corr-page")
    // .append("svg")
    // .attr("width", this.state.w)
    // .attr("height", this.state.h);
    }




    plotMatrix = () => {
        var left = 50;
        var right = 500;
        var top = 50;
        var bottom = 500;


        var correlationMatrix = this.props.getTopicCorrelations();
        var correlationGraph = this.getCorrelationGraph(correlationMatrix, -100.0);
      
        var topicScale = d3.scalePoint().domain(d3.range(this.props.numTopics)).range([left, right]);
        var radiusScale = d3.scaleSqrt().domain([0, 1.0]).range([0, 450 / (2 * this.props.numTopics)]);
      
        var horizontalTopics = this.vis.selectAll("text.hor").data(correlationGraph.nodes);
        horizontalTopics.exit().remove();
        horizontalTopics = horizontalTopics.enter().append("text")
          .attr("class", "hor")
        .merge(horizontalTopics);

      
        horizontalTopics
          .attr("x", right + 10)
          .attr("y", function(node) { return topicScale(node.name); })
          .text(function(node) { return node.words; });
      
        var verticalTopics = this.vis.selectAll("text.ver").data(correlationGraph.nodes);
        verticalTopics.exit().remove();
        verticalTopics = verticalTopics.enter().append("text")
          .attr("class", "ver")
        .merge(verticalTopics);
      
        verticalTopics
          .attr("x", function(node) { return topicScale(node.name); })
          .attr("y", bottom + 10)
          .attr("transform", function(node) { return "rotate(90," + topicScale(node.name) + "," + (bottom + 10) + ")"; })
          .text(function(node) { return node.words; });
      
        var circles = this.vis.selectAll("circle").data(correlationGraph.links);
        circles.exit().remove();
        circles = circles.enter().append("circle").merge(circles);
      
        circles.attr("cx", function(link) { return topicScale(link.source); })
        .attr("cy", function(link) { return topicScale(link.target); })
        .attr("r", function (link) { return radiusScale(Math.abs(link.value)); })
        .style("fill", function (link) { return link.value > 0.0 ? "#88f" : "#f88"; })
        .on("mouseover", function (link) {
          var tooltip = d3.select("#tooltip");
          var tooltipX = this.getBoundingClientRect().x;
          var tooltipY = this.getBoundingClientRect().y;
          tooltip.style("visibility", "visible")
          .style("top", (tooltipY-10)+"px").style("left",(tooltipX+20)+"px")
          .text(correlationGraph.nodes[link.target].words + " / " + correlationGraph.nodes[link.source].words);
        })
     
        .on("mouseout", function () {
          var tooltip = d3.select("#tooltip");
          tooltip.style("visibility", "hidden");
        });
      }
    

    getCorrelationGraph = (correlationMatrix, cutoff) => {
        var graph = {"nodes": [], "links": []};
        for (var topic = 0; topic < this.props.numTopics; topic++) {
          if (this.props.topicWordCounts[topic]){
          graph.nodes.push({"name": topic, "group": 1, "words":topNWords(this.props.topicWordCounts[topic], 3)});}
          else {
            graph.nodes.push({"name": topic, "group": 1, "words":""})
          }
        }
        for (var t1 = 0; t1 < this.props.numTopics; t1++) {
          for (var t2 = 0; t2 < this.props.numTopics; t2++) {
            if (t1 !== t2 && correlationMatrix[t1][t2] > cutoff) {
              graph.links.push({"source": t1, "target": t2, "value": correlationMatrix[t1][t2]});
            }
          }
        }
        return graph;
      }

    componentDidMount() {
      this.vis = d3.select("#corr-page").append("svg").attr("width", this.state.w).attr("height", this.state.h);

      this.plotMatrix();
    }

    componentDidUpdate(prevProps) {
        this.plotMatrix();
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (nextProps.update === false) {
          return false
      }
      return true
  }

    render() {
      return (
      <div id="corr-page" className="page">
        <div className="help">Topics that occur together more than expected are blue, topics that occur together less than expected are red.</div>
      </div>
      )
    }
}

export default Correlation;