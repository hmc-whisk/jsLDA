// import * as d3 from "d3";
import './Treemap.css';
import "react-d3-treemap/dist/react.d3.treemap.css";
import React from "react";
import TreeMap, { ColorModel } from "react-d3-treemap";
import { topNWords } from "funcs/utilityFunctions";
import { LDAModel } from 'core'

interface topicTreemapProps{
    ldaModel:LDAModel
}

export class TopicTreemap extends React.Component<topicTreemapProps> {   
    constructor(props: topicTreemapProps) {
        super(props);
      }

    topWordsProbability(wordsList:Array<string>){
        type wordProbPair = {
            name: string;
            value: number;
          };
          let data: { name: string; children: wordProbPair[] } = {
            name: "wordProbs",
            children: [],
          };
          for (let word of wordsList) {
            let prob = this.props.ldaModel.pWordGivenTopic(
              word,
              this.props.ldaModel.selectedTopic
            );
            prob = prob*100;
            let temp: wordProbPair = { name: word, value: prob };
            data.children.push(temp);
            }
        return data;
    }
    
    noTopicSelected() {
        return (
            <div id="pages">
                <div id="tm-page" className="page">
                    <h2 id="label" style={{position: "relative"}}> Treemap: Please select a topic</h2>
                </div>
            </div>
        )
    }
    
    createTreeMap(){
        let topic = this.props.ldaModel.selectedTopic;
        let topWordsString = topNWords(
          this.props.ldaModel.topicWordCounts[topic], 10);
        let topWordsList = topWordsString.split(" ");
        let treeData = this.topWordsProbability(topWordsList);
        console.log(treeData);
        return (
            <div>
                    treemap[help instruction]
                    topic
                    <TreeMap
                        id="topicTreeMap"
                        height={500}
                        width={600}
                        data={treeData}
                        colorModel={ColorModel.OneEachChildren}
                        paddingInner={3}
                        levelsToDisplay={2}
                        nodeStyle={{ paddingLeft: 5, paddingRight: 5 }}
                        valueFn={n=>n.toFixed(2) + "%"}
                        tooltipOffsetY={140}
                        tooltipOffsetX={330}
                        tooltipPlacement="top"
                    />
            </div>
        )
    }

    render() {
        if (this.props.ldaModel.selectedTopic === -1) {
            return this.noTopicSelected()
        }
        
        return (
            <div id="pages">
                <div id="tM-page" className="page">
                    {this.createTreeMap()}
                </div>
            </div>
        )
    }
}

export default TopicTreemap
