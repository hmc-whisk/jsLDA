// import * as d3 from "d3";
import './Treemap.css';
import "react-d3-treemap/dist/react.d3.treemap.css";
import React from "react";
import TreeMap, { ColorModel } from "react-d3-treemap";
import { topNWords } from "funcs/utilityFunctions";
import { LDAModel } from 'core'

/**
 * @summary Component for Visualization page
 * @requires
 *  @prop ldaModel
 *
 */

interface topicTreemapProps{
    ldaModel:LDAModel
}

interface topicTreemapState{
}

export class TopicTreemap extends React.Component<topicTreemapProps, topicTreemapState> {
    constructor(props: topicTreemapProps) {
        super(props);
      }

    // helper function to calculate the probalibity of words per topic
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

    // create treemap when a topic is selected
    createTreeMap(){
        // get data ready
        let topic = this.props.ldaModel.selectedTopic;
        let topWordsString = topNWords(
          this.props.ldaModel.topicWordCounts[topic], 10);
        let topWordsList = topWordsString.split(" ");
        let treedata = this.topWordsProbability(topWordsList);

        return <div>
                    treemap[help instruction]
                    <TreeMap<typeof treedata>
                        height={500}
                        width={600}
                        data={treedata}
                        colorModel={ColorModel.OneEachChildren}
                        paddingInner={3}
                        levelsToDisplay={1}
                        nodeStyle={{ paddingLeft: 5, paddingRight: 5 }}
                        valueFn={n=>n.toFixed(2) + "%"}
                        valueUnit={(this.props.ldaModel.selectedTopic).toString()}
                        tooltipOffsetY={160}
                        tooltipOffsetX={330}
                        tooltipPlacement="top"
                        key={Math.random()} // force recreate element when rerender
                    />
            </div>
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
