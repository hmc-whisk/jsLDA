import React from "react";
import * as d3 from "d3"
import {topNWords, zeros} from '../../funcs/utilityFunctions'

/**
 * @summary Component for Download page
 * @requires
 *  @prop numTopics
 *  @prop documents
 *  @prop wordTopicCounts
 *  @prop topicWordCounts
 *  @prop sortTopicWords
 *  @prop getTopicCorrelations
 *  @prop tokensPerTopic
 */
class DLPage extends React.Component {

    render() {
        return (

            <div id="pages">

                <div id="dl-page" className="page">
                    <div className="help">Each file is in comma-separated format.</div>
                    <ul>
                        <li><a id="doctopics-dl" href="#" download="doctopics.csv" onClick={() => this.saveDocTopics()}>Document topics</a></li>
                        <li><a id="topicwords-dl" href="#" download="topicwords.csv" onClick={() => this.saveTopicWords()}>Topic words</a></li>
                        <li><a id="keys-dl" href="#" download="keys.csv" onClick={() => this.saveTopicKeys()}>Topic summaries</a></li>
                        <li><a id="topictopic-dl" href="#" download="topictopic.csv" onClick={() => this.saveTopicPMI()}>Topic-topic connections</a></li>
                        <li><a id="graph-dl" href="#" download="gephi.csv" onClick={() => this.saveGraph()}>Doc-topic graph file (for Gephi)</a></li>
                        <li><a id="state-dl" href="#" download="state.csv" onClick={() => this.saveState()}>Complete sampling state</a></li>
                        <li><a id="topicstime-dl" href="#" download="topicstime.csv" onClick={() => this.saveTopicsTime()}>Topic values over time</a></li>
                    </ul>
                </div>

            </div>

        );
    }


    eightDigits = d3.format(".8");

    toURL(s, type) {
        // Chrome will not process data URIs larger than 2M
        if (s.length < 1500000) {
          return "data:Content-type:" + type + ";charset=UTF-8," + encodeURIComponent(s);
        }
        else {
          var blob = new Blob([s], {type: type});
          return window.URL.createObjectURL(blob);
        }
    }

    /**
     * @summary changes the href of topicstime-dl to a csv of topics over time
     * @author Theo Bayard de Volo
     * Note: If the date ids have quotes in them, this will strip them out
     * for the csv because they would make the file unreadable. 
     */
    saveTopicsTime = () => {
        // Set up CSV column names
        var topicTimeCSV = "Topic Number";

        // Add a csv row for every topic
        for (let topic = 0; topic < this.props.numTopics; topic++) {
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
            
            // Add column names on first pass
            if(topic === 0) {
                for (let i = 0; i < topicMeans.length; i++) {
                    topicTimeCSV += ',"' + topicMeans[i].key.replace('"','') + '"'
                }
                topicTimeCSV += "\n"
            }

            // Add topic Number
            topicTimeCSV += topic + ",";

            // Add mean values
            for (let i = 0; i < topicMeans.length; i++){
                topicTimeCSV += topicMeans[i].value + ",";
            }
            topicTimeCSV = topicTimeCSV.slice(0,-1); // Remove last comma
            topicTimeCSV = topicTimeCSV += "\n";
        }
        d3.select("#topicstime-dl").attr("href", this.toURL(topicTimeCSV, "text/csv"));
    }

    saveDocTopics = () => {
        var docTopicsCSV = "";
      
        this.props.documents.forEach(function(d, i) {
            docTopicsCSV += d.id + "," + d.topicCounts.map((x) => { return d3.format(".8")(x / d.tokens.length); }).join(",") + "\n";
        });
      
        d3.select("#doctopics-dl").attr("href", this.toURL(docTopicsCSV, "text/csv"));
    }
      
    saveTopicWords = () => {
        var topicWordsCSV = "word," + d3
            .range(0, this.props.numTopics)
            .map(function(t) {return "topic" + t; } )
            .join(",") + "\n";
        for (let word in this.props.wordTopicCounts) {
            let topicProbabilities = zeros(this.props.numTopics);
            for (let topic in this.props.wordTopicCounts[word]) {
                topicProbabilities[topic] = this.eightDigits(
                    this.props.wordTopicCounts[word][topic] / 
                    this.props.tokensPerTopic[topic]);
            }
            topicWordsCSV += word + "," + topicProbabilities.join(",") + "\n";
        }
      
        d3.select("#topicwords-dl").attr("href", this.toURL(topicWordsCSV, "text/csv"));
    }
      
    saveTopicKeys = () => {
        var keysCSV = "Topic,TokenCount,Words\n";
      
        if (this.props.topicWordCounts.length == 0) { this.props.sortTopicWords(); }
      
            for (var topic = 0; topic < this.props.numTopics; topic++) {
                keysCSV += topic + "," + this.props.tokensPerTopic[topic] + 
                ",\"" + topNWords(this.props.topicWordCounts[topic], 10)
                + "\"\n";
            }
      
        d3.select("#keys-dl").attr("href", this.toURL(keysCSV, "text/csv"));
    }
      
    saveTopicPMI = () => {
        var pmiCSV = "";
        var matrix = this.props.getTopicCorrelations();
        matrix.forEach((row) => { 
            pmiCSV += row.map((x) => { 
                return this.eightDigits(x); 
            }).join(",") + "\n"; 
        });
        d3.select("#topictopic-dl").attr("href", this.toURL(pmiCSV, "text/csv"));
    }
      
    saveGraph = () => {
        var graphCSV = "Source,Target,Weight,Type\n";
        var topicProbabilities = zeros(this.props.numTopics);
      
        this.props.documents.forEach((d, i) => {
            d.topicCounts.forEach((x, topic) => {
                if (x > 0.0) {
                graphCSV += d.id + "," + topic + "," + this.eightDigits(x / d.tokens.length) + ",undirected\n";
                }
            });
        });
      
        d3.select("#graph-dl").attr("href", this.toURL(graphCSV, "text/csv"));
    }
      
    saveState = () => {
        var state = "DocID,Word,Topic";
        this.props.documents.forEach(function(d, docID) {
            d.tokens.forEach(function(token, position) {
                if (! token.isStopword) {
                    state += docID + ",\"" + token.word + "\"," + token.topic + "\n";
                }
            });
        });

        d3.select("#state-dl").attr("href", this.toURL(state, "text/csv"));
    }

}

export default DLPage;
