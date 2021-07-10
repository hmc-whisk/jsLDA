import * as d3 from 'd3';
import React, {Component} from 'react';
import {topNWords} from 'funcs/utilityFunctions'
import Tooltip from '../Tooltip';
import './pages.css';
import type {LDADocument} from "core";

const backColor = getComputedStyle(document.documentElement).getPropertyValue('--color3');

/* This function will compute pairwise correlations between topics.
 * Unlike the correlated topic model (CTM) LDA doesn't have parameters
 * that represent topic correlations. But that doesn't mean that topics are
 * not correlated, it just means we have to estimate those values by
 * measuring which topics appear in documents together.
 */


interface CorrelationProps {
    topicWordCounts: { word: string, count: number }[][],
    numTopics: number,
    documents: LDADocument[],
    getTopicCorrelations: () => number[][],
    changeNotes: (notes: string) => void,
    provideNotes: () => string,
    tooltip: string,
    update: boolean
}

interface CorrelationState {
    w: number,
    h: number,
    correlationMinTokens: number,
    correlationMinProportion: number,
    hover: boolean
}

type CorrelationNode = { name: number, group: number, words: string }
type CorrelationLink = { source: number, target: number, value: number }

type CorrelationGraph = {
    nodes: CorrelationNode[],
    links: CorrelationLink[]
}

export class Correlation extends Component<CorrelationProps, CorrelationState> {
    constructor(props: CorrelationProps) {
        super(props);
        this.state = {
            w: 1000,
            h: 1000,
            // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
            correlationMinTokens: 2,
            correlationMinProportion: 0.05,
            hover: false
        };
        this.vis = d3.select("#corr-page")
    }

    vis: d3.Selection<any, any, HTMLElement, any>
    notes = ``;

    plotMatrix = () => {
        let left = 50;
        // let top = 50;
        // right and bottom found by trial and error
        // originally set to 550

        let right = this.props.numTopics * 4.6 + 430;
        let bottom = this.props.numTopics * 4.6 + 430;
        console.log()
        let fontSize = this.props.numTopics * -.3 + 25;


        let correlationMatrix = this.props.getTopicCorrelations();
        let correlationGraph = this.getCorrelationGraph(correlationMatrix, -100.0);

        let topicScale = d3.scalePoint<number>().domain(d3.range(this.props.numTopics)).range([left, right]);
        let radiusScale = d3.scaleSqrt().domain([0, 1.0]).range([0, 450 / (2 * this.props.numTopics)]);

        let horizontalTopics = this.vis.selectAll("text.hor").data(correlationGraph.nodes) as d3.Selection<any, CorrelationNode, HTMLElement, any>;
        horizontalTopics.exit().remove();
        horizontalTopics = horizontalTopics.enter().append("text")
            .attr("class", "hor")
            .merge(horizontalTopics)
            .style("font-size", fontSize);

        let verticalTopics = this.vis.selectAll("text.ver").data(correlationGraph.nodes) as d3.Selection<any, CorrelationNode, HTMLElement, any>;
        verticalTopics.exit().remove();
        verticalTopics = verticalTopics.enter().append("text")
            .attr("class", "ver")
            .merge(verticalTopics)
            .style("font-size", fontSize);

        if (this.props.numTopics > 50) {
            horizontalTopics
                .attr("x", right + 50)
                .attr("y", function (node) {
                    let t = topicScale(node.name)
                    return t ? t : null;
                })
                .text(function (node) {
                    if (node.name % 5 === 0)
                        return '[' + node.name + '] '
                    else return null;
                })
                .style("font-size", 16);

            verticalTopics
                .attr("x", function (node) {
                    let t = topicScale(node.name)
                    return t ? t : null;
                })
                .attr("y", bottom + 50)
                .attr("transform", function (node) {
                    return "rotate(90," + topicScale(node.name) + "," + (bottom + 50) + ")";
                })
                .text(function (node) {
                    if (node.name % 5 === 0)
                        return '[' + node.name + '] '
                    else return null;
                })
                .style("font-size", 16);
        } else {
            horizontalTopics
                .attr("x", right + 50)
                .attr("y", function (node) {
                    let t = topicScale(node.name)
                    return t ? t : null;
                })
                .text(function (node) {
                    return '[' + node.name + '] ' + node.words;
                })
                .style("font-size", fontSize);
            verticalTopics
                .attr("x", function (node) {
                    let t = topicScale(node.name)
                    return t ? t : null;
                })
                .attr("y", bottom + 50)
                .attr("transform", function (node) {
                    return "rotate(90," + topicScale(node.name) + "," + (bottom + 50) + ")";
                })
                .text(function (node) {
                    return '[' + node.name + '] ' + node.words;
                });
        }


        let circles = this.vis.selectAll("circle").data(correlationGraph.links) as d3.Selection<any, CorrelationLink, HTMLElement, any>;
        circles.exit().remove();
        circles = circles.enter().append("circle").merge(circles);

        let posColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--positiveCorrelationColor');
        let negColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--negativeCorrelationColor');

        circles.attr("cx", function (link) {
            let t = topicScale(link.source)
            return t ? t : null;
        })
            .attr("cy", function (link) {
                let t = topicScale(link.target)
                return t ? t : null;
            })
            .attr("r", function (link) {
                return radiusScale(Math.abs(link.value));
            })
            .style("fill", function (link) {
                return link.value > 0.0 ? posColor : negColor;
            })
            .on("mouseover", function (link) {
                let tooltip = d3.select("#tooltip");
                let tooltipX = this.getBoundingClientRect().x + window.scrollX;
                let tooltipY = this.getBoundingClientRect().y + window.scrollY;
                tooltip.style("visibility", "visible")
                    .style("top", (tooltipY - 10) + "px").style("left", (tooltipX + 20) + "px")
                    .text('[' + correlationGraph.nodes[link.target].name + '] '
                        + correlationGraph.nodes[link.target].words + " / "
                        + '[' + correlationGraph.nodes[link.source].name + '] '
                        + correlationGraph.nodes[link.source].words
                        + ": " + link.value.toFixed(3));
            })
            .on("mouseout", function () {
                let tooltip = d3.select("#tooltip");
                tooltip.style("visibility", "hidden");
            });
    }


    getCorrelationGraph(correlationMatrix: number[][], cutoff: number) {
        let graph: CorrelationGraph = {
            nodes: [] as CorrelationNode[],
            links: [] as CorrelationLink[]
        };
        for (let topic = 0; topic < this.props.numTopics; topic++) {
            if (this.props.topicWordCounts[topic]) {
                graph.nodes.push({"name": topic, "group": 1, "words": topNWords(this.props.topicWordCounts[topic], 3)});
            } else {
                graph.nodes.push({"name": topic, "group": 1, "words": ""})
            }
        }
        for (let t1 = 0; t1 < this.props.numTopics; t1++) {
            for (let t2 = 0; t2 < this.props.numTopics; t2++) {
                if (t1 !== t2 && correlationMatrix[t1][t2] > cutoff) {
                    graph.links.push({"source": t1, "target": t2, "value": correlationMatrix[t1][t2]});
                }
            }
        }
        return graph;
    }

    componentDidMount() {
        this.vis = d3.select("#corr-page").append("svg").attr("width", this.state.w).attr("height", this.state.h);
        this.notes = this.props.provideNotes();
        let notes = this.notes;
        let changeNotes = this.props.changeNotes
        // d3.select("#corr-page").append("foreignObject")
        //     .append('xhtml:div')
        //     .append('div')
        //     .attr("style", "white-space: pre-line; background: #ECECEC; border-collapse: separate; border-radius: 3px; ")
        //     .attr("dataText", "Write your notes here")
        //     .attr("contentEditable", true)
        //     .on("blur", function () {
        //         let innerText = this.innerText
        //         if (innerText[innerText.length - 1] === '\n') {
        //             innerText = innerText.slice(0, -1)
        //         }
        //         notes = innerText;
        //         changeNotes(innerText);
        //     })
        //     .text(notes)

        this.plotMatrix();
    }

    componentDidUpdate() {
        this.plotMatrix();
    }

    shouldComponentUpdate(nextProps: CorrelationProps) {
        return nextProps.update
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
            document.getElementById("overlay")!.style.display = "block";
        }
    }

    overlayOff = () => {
        if (document.getElementById("overlay")) {
            document.getElementById("overlay")!.style.display = "none";
        }
    }

    toggleHover = () => {
        this.setState({hover: !this.state.hover})
    }

    render() {
        return (
            <div>
                <div id="corr-page" className="page">
                    <div className="help" style={{padding:"20px", paddingTop:'0px', margin:"0px"}}>Topic correlations are pointwise mutual information scores.
                        This score measures whether two topics occur in the same document more often than we would
                        expect by chance.
                        Previous versions of this script calculated correlations on log ratios. Data for the plot is
                        available from the Downloads page. <a
                            href="https://en.wikipedia.org/wiki/Pointwise_mutual_information" style={{color: 'blue'}}>More
                            about this metric on Wikipedia.</a>
                        <div style={{marginTop:'15px'}}>
                            <Tooltip
                                floatRight={false}
                                displayElement={
                                    <div style={{backgroundColor: backColor,
                                        position: "fixed",
                                        top: "10%",
                                        left: "10%",
                                        right: "10%",
                                        borderRadius: "20px 0px 0px 20px",
                                        margin: "10px",
                                        height: "70%",
                                        overflowY: "scroll"}}>
                                            <div style={{margin:"15px"}}>
                                                <h4 style={{textAlign: "center"}}>Understanding the Graph</h4>
                                                <ul>
                                                    <li>
                                                        The two axes represent each of the generated topics, and are labeled by topic number and the 
                                                        top three most common words found in that topic.                                                
                                                    </li>
                                                    <li>
                                                        Negative pointwise information is represented by a blue circle, while positive pointwise information 
                                                        is represented by a red one.
                                                    </li>
                                                    <li>
                                                        The size of the circle represents the magnitudes of the positive or negative correlation.
                                                    </li>
                                                    <li>
                                                        When you hover over a circle, the two topics that are represented by that circle should be shown.
                                                    </li>
                                                </ul>
                                                {/* We need to update the image. */}
                                                {/* <img src={this.props.tooltip} className="media-object"
                                                    height={'auto'} width={'80%'} style={{marginLeft:'10%', marginTop:'15px'}}
                                                    draggable='false'/> */}
                                            </div>
                                    </div>
                                }/>
                                {/* tooltip={this.props.tooltip}
                                    altText={"The two axes represent each of the generated topics. Negative pointwise information\
                                    is represented by a dark circle, positive is lighter. \
                                    On hover over a circle, the two topics that the circle represents are shown."}/> */}
                        </div>
                    </div>

                </div>
            </div>
        )
    }
}

export default Correlation;
