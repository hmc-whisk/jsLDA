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
        w: 900,
        h: 900,
        // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
        correlationMinTokens: 2,
        correlationMinProportion: 0.05,
        hover: false
      };

    }




    plotMatrix = () => {
        var left = 50;
        var right = 600;
        var top = 50;
        var bottom = 600;


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
          .attr("x", right + 50)
          .attr("y", function(node) { return topicScale(node.name); })
          .text(function(node) { return node.words; });
      
        var verticalTopics = this.vis.selectAll("text.ver").data(correlationGraph.nodes);
        verticalTopics.exit().remove();
        verticalTopics = verticalTopics.enter().append("text")
          .attr("class", "ver")
        .merge(verticalTopics);
      
        verticalTopics
          .attr("x", function(node) { return topicScale(node.name); })
          .attr("y", bottom + 50)
          .attr("transform", function(node) { return "rotate(90," + topicScale(node.name) + "," + (bottom + 50) + ")"; })
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
        console.log(correlationMatrix);
        return graph;
      }

    componentDidMount() {
      this.vis = d3.select("#corr-page").append("svg").attr("width", this.state.w).attr("height", this.state.h);

      console.log("Initial Matrix Plot");
      this.plotMatrix();
    }

    componentDidUpdate(prevProps) {
        console.log("Updateing Matrix");
        this.plotMatrix();
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (nextProps.update === false) {
          return false;
      }
      return true;
  }

  
    overlayStyle = {
    position: 'fixed',
      display: 'none',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2,
      cursor: 'pointer',
    }

    textstyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: '50px',
    color: 'white',
    transform: 'translate(-50%,-50%)',
    msTransform: 'translate(-50%,-50%)',
    }

    overlayOn = () => {
      if (document.getElementById("overlay")) {
      document.getElementById("overlay").style.display = "block";}
    }
  
    overlayOff = () => {
      if (document.getElementById("overlay")) {
      document.getElementById("overlay").style.display = "none";}
    }

    toggleHover = () => {
      this.setState({hover: !this.state.hover})
    }

    render() {
      let buttonstyle = {}
      if (this.state.hover) {
        buttonstyle = {
        border: 'solid #ddd 2px',
        margin:'0 2px 0 0',
        padding:'7px 10px',
        display:'block',
        position:'relative',
        left: '800',
        fontSize : '1em',
        color:'#333',
        webkitUserSelect:'none',
        mozUserSelect:'none',
        userSelect: 'none',
        mozBorderRadius: '4px',
        borderRadius: '4px',
        background: '#ddd',
        cursor:'pointer'}
      }
      else {
        buttonstyle = {
        border: 'solid #ddd 2px',
        margin:'0 2px 0 0',
        padding:'7px 10px',
        display:'block',
        position: 'relative',
        left: '800',
        fontSize : '1em',
        color:'#333',
        webkitUserSelect:'none',
        mozUserSelect:'none',
        userSelect: 'none',
        mozBorderRadius: '4px',
        borderRadius: '4px',
        background: '#FFFFFF',
        cursor:'auto'
      }
    }

      return (
        <div>
        <div id="corr-page" className="page">
        <div className="help">Point mutual information is used as a measure of correlation between topics.</div>
        <div id="overlay" style= {this.overlayStyle} onClick={this.overlayOff}>
        <div id="text" style= {this.textstyle}>  <img src= {this.props.tooltip} class="media-object" alt="Sample Image" draggable= 'false'/></div>
        </div>

        <div style={{padding:'2px'}}>
        <button onClick={this.overlayOn} style= {buttonstyle} onMouseEnter={this.toggleHover} onMouseLeave={this.toggleHover}>Tooltip</button>
        </div>
      </div>
      </div>
      )
    }
}

export default Correlation;