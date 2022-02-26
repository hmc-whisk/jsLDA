import '../Visualization/Treemap.css';
import "react-d3-treemap/dist/react.d3.treemap.css";
import React from "react";
import Card from 'react-bootstrap/Card';
import TreeMap, { ColorModel } from "react-d3-treemap";
import { LDAModel, SortedLDADocument } from 'core'
import { scaleSequential } from "d3-scale";
import * as chromatic from "d3-scale-chromatic";

interface DocTreeMapProps{
    ldaModel: LDAModel
    document: SortedLDADocument
    size: string
}

interface DocTreeMapState{}

/**
 * @summary A class for treemaps of the topic spread in a document
 * @requires
 *  @prop ldaModel
 */

export class DocTreeMap extends React.Component<DocTreeMapProps, DocTreeMapState>{
    getData(){
        type topicProbPair = {
            name: string,
            value: number
        };

        // Create the head of the tree.
        let data: { name: string; children: topicProbPair[] } = {
        name: "Top 5 Topic Probabilities",
        children: [],
        };

        // Calculate the scores for each topic within the document.
        let topicScores = [];
        let sum = 0;
        for (let i = 0; i < this.props.ldaModel.numTopics; i++){
            let thisScore = this.props.ldaModel._documentTopicSmoothing[i] + this.props.document.topicCounts[i];
            topicScores.push(thisScore);
            sum += thisScore;
        }
        // Push topicProbPair objects with corresponding topics and scores into data.children.
        for (let i = 0; i < this.props.ldaModel.numTopics; i++) {
            let temp: topicProbPair = { name: i.toString(), value: (topicScores[i] / sum)*100 };
            data.children.push(temp);
        }

        // Sort the data from highest score to lowest score.
        data.children.sort((a, b) => (a.value < b.value) ? 1 : -1);
        data.children = data.children.slice(0,5);

        return data;
    }

    createTreeMap(){
        let treedata = this.getData();
        let size = this.props.size.split(",", 2)

        return <Card.Body>
                    <div>
                        <TreeMap<typeof treedata>
                            height={parseInt(size[0])}
                            width={parseInt(size[1])}
                            data={treedata}
                            colorModel={ColorModel.OneEachChildren}
                            paddingInner={3}
                            levelsToDisplay={1}
                            nodeStyle={{paddingLeft: 10, paddingRight: 5, paddingTop:2}}
                            valueFn={n=>n.toFixed(2) + "%"}
                            tooltipOffsetY={140}
                            tooltipOffsetX={-40}
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
            </Card.Body>
    }

    render() {
        return(
            <div>
                {this.createTreeMap()}
            </div>
        )
    }
}

export default DocTreeMap;