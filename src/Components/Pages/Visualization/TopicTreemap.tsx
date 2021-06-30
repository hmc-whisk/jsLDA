// import * as d3 from "d3";
import './Treemap.css';
import "react-d3-treemap/dist/react.d3.treemap.css";
import React, { ChangeEvent } from "react";
import TreeMap, { ColorModel } from "react-d3-treemap";
import { topNWords } from "funcs/utilityFunctions";
import { LDAModel } from 'core'

import { scaleSequential } from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import { relative } from 'path/posix';

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
    numberOfTopwords:number
}

export class TopicTreemap extends React.Component<topicTreemapProps, topicTreemapState> {
    constructor(props: topicTreemapProps) {
        super(props);
        this.state={
            numberOfTopwords:10
        }
      }

    // helper function to calculate the probalibity of words per topic
    topWordsProbability(wordsList:Array<string>){
        type wordProbPair = {
            name: string;
            value: number;
          };
          let data: { name: string; children: wordProbPair[] } = {
            name: "Top Word Probabilities",
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

    numChange(event: ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        if (parseInt(event.target.value) > 30) event.target.value = "30";

        this.setState({
            numberOfTopwords: Math.max(1, parseInt(event.target.value)),
        })
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
    createTreeMap(numTopwords:number){
        // get data ready
        let topic = this.props.ldaModel.selectedTopic;
        let topWordsString = topNWords(
          this.props.ldaModel.topicWordCounts[topic], numTopwords);
        let topWordsList = topWordsString.split(" ");
        let treedata = this.topWordsProbability(topWordsList);

        return <div>
                    <TreeMap<typeof treedata>
                        height={500}
                        width={750}
                        data={treedata}
                        colorModel={ColorModel.OneEachChildren}
                        paddingInner={3}
                        levelsToDisplay={1}
                        nodeStyle={{paddingLeft: 10, paddingRight: 5, paddingTop:2}}
                        valueFn={n=>n.toFixed(2) + "%"}
                        tooltipOffsetY={160}
                        tooltipOffsetX={330}
                        tooltipPlacement="top"
                        paddingOuter={0}
                        lightNodeBorderColor="white"
                        disableBreadcrumb = {true}
                        key={Math.random()} // force recreate element when rerender
                        // @ts-ignore
                        customD3ColorScale={scaleSequential(
                            chromatic.interpolateGnBu
                        )}
                    />
            </div>
    }

    render() {
        if (this.props.ldaModel.selectedTopic === -1) {
            return this.noTopicSelected()
        }

        return (
            <div id="pages" style={{position: "relative", left: 30, paddingTop:20}}>
                treemap[help instruction]
                <div id="numWords" className="page" style={{position: "relative", left: 0, paddingBottom:0}} >
                    Number of Top Words:
                    <input
                        onChange={this.numChange.bind(this)}
                        placeholder="# top Wrods"
                        type="number" id="numberOfBins"
                        value={this.state.numberOfTopwords}
                        max="300"
                        min="5"
                        step="1"
                        style={{position: "relative", left:5}}
                    />
                </div>
                <div id="tM-page" className="page">
                    {this.createTreeMap(this.state.numberOfTopwords)}
                </div>
            </div>
        )
    }
}

export default TopicTreemap
