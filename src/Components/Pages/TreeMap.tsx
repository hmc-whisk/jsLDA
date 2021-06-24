import * as d3 from "d3";
import React, { Component } from "react";
import { useRef, useEffect } from "react";

import { topNWords } from "funcs/utilityFunctions";
import Tooltip from "../Tooltip";
import "./pages.css";
import { LDAModel } from "core";
import TreeMapD3 from "react-d3-treemap";
import "react-d3-treemap/dist/react.d3.treemap.css";

interface TreeMapProps {
  ldaModel: LDAModel;
}

interface TreeMapArgs {
    name: string;
    value?: number;
    children?: Array<TreeMapArgs>;
    className?: string;
}

export class TreeMap extends Component<TreeMapProps> {
  constructor(props: TreeMapProps) {
    super(props);
    const topic = this.props.ldaModel.selectedTopic;
    let topWordsString = topNWords(
      this.props.ldaModel.topicWordCounts[topic],
      10
    );
    let topWordsList = topWordsString.split(" ");
    // this.state = {};
    this.vis = d3.select("#treemap-page"); // correlation style
  }

  vis: d3.Selection<any, any, HTMLElement, any>;

  plotTreeMap() {


    // const root = d3.treemap().size([400, 400]).padding(1).round(true)(d3.hierarchy(data));
  }

  topWordsProbabilities(topWordsList: string[]) {
    type wordProbPair = {
      name: string;
      value: number;
    };
    let data: { name: string; children: wordProbPair[] } = {
      name: "wordProbs",
      children: [],
    };
    for (let word of topWordsList) {
      let prob = this.props.ldaModel.pTopicGivenWord(
        word,
        this.props.ldaModel.selectedTopic
      );
      prob = prob*100;
      let temp: wordProbPair = { name: word, value: prob };
      data.children.push(temp);
    }

    return data;
  }

  componentDidMount() {
    this.plotTreeMap();
  }

  render() {

    const topic = this.props.ldaModel.selectedTopic;
    let topWordsString = topNWords(
      this.props.ldaModel.topicWordCounts[topic],
      10
    );
    let topWordsList = topWordsString.split(" ");
    let data = this.topWordsProbabilities(topWordsList);

    console.log(data);
    return <div id="treemap-page" style={{position: "relative"}}>tree map here
    <TreeMapD3<TreeMapArgs>
    id="myTreeMap"
    width={500}
    height={400}
    data={this.topWordsProbabilities(topWordsList)}
    // valueUnit={"%"}
    // valueFormat={".2f"}
    valueFn={n=>n.toFixed(2) + "%"}
    />
    </div>;
  }
}

export default TreeMap;
