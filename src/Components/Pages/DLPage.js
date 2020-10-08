import React from "react";
import * as d3 from "d3"
import {topNWords, zeros, saveFile} from '../../funcs/utilityFunctions'

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
                    <div className="help">All of the following downloads, except for the model download, are in CSV format. Quotation marks are stripped from words upon download to avoid CSV errors.</div>
                    <ul>
                        <li>{this.modelSaver}</li>
                        <li>{this.docTopics}</li>
                        <li>{this.topicWords}</li>
                        <li>{this.topicSummary}</li>
                        <li>{this.topicPMI}</li>
                        <li>{this.graphFile}</li>
                        <li>{this.stateFile}</li>
                        <li>{this.topicsTime}</li>
                    </ul>
                </div>

            </div>

        );
    }

    get modelSaver() {
        let description = "A copy of your current model which you can upload to this website and continue working on."
        return (
            <>
                <button id="model-dl"
                    onClick={() => this.props.downloadModel()}>
                    LDA Model
                </button>
                : {description}
            </>
        )
    }

    get docTopics() {
        let description = "Every topic value for every document."
        return (
            <>
                <button id="doctopics-dl"
                    onClick={() => this.saveDocTopics()}>
                    Document Topics
                </button>
                : {description}
            </>
        )
    }

    get topicWords() {
        let description = "The average topic value for every word type."
        return (
            <>
                <button id="topicwords-dl"
                    onClick={() => this.saveTopicWords()}>
                    Topic Words
                </button>
                : {description}
            </>
        )
    }

    get topicSummary() {
        let description = "The topic number, annotation, token count, and top 10 words for every topic."
        return (
            <>
                <button id="keys-dl"
                    onClick={() => this.saveTopicKeys()}>
                    Topic Summaries
                </button>
                : {description}
            </>
        )
    }

    get topicPMI() {
        let description = "The pointwise mutual information score between every pair of topics."
        return (
            <>
                <button id="topictopic-dl"
                    onClick={() => this.saveTopicPMI()}>
                    Topic-Topic Correlations
                </button>
                : {description}
            </>
        )
    }

    get graphFile() {
        let description = "Formatted to make graphs in Gephi."
        return (
            <>
                <button id="graph-dl"
                    onClick={() => this.saveGraph()}>
                    Doc-Topic Graph File
                </button>
                : {description}
            </>
        )
    }

    get stateFile() {
        let description = "The topic assignment for every token."
        return (
            <>
                <button id="state-dl"
                    onClick={() => this.saveState()}>
                    Complete Sampling State
                </button>
                : {description}
            </>
        )
    }

    get topicsTime() {
        let description = "The proportion of tokens assigned to a topic at every time stamp."
        return (
            <>
                <button id="topicstime-dl"
                    onClick={() => this.saveTopicsTime()}>
                    Topic Values Over Time
                </button>
                : {description}
            </>
        )
    }

    /**
     * Function to prevent a word from messing up CSVs.
     * Mostly, quotations need to be stripped.
     * @param {String} w word to sterilize
     */
    sterilizeWord(w) {
        return w.replace(/"/g,"");
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

        this.saveFile("topicsTime.csv",topicTimeCSV,"text/csv");
    }

    saveDocTopics = () => {
        // Set up header
        var docTopicsCSV = "Document ID";
        for(let i = 0; i < this.props.numTopics; i++) {
            docTopicsCSV += ",Topic " + i;
        }
        docTopicsCSV += "\n";
      
        // Add rows of each document's topic values
        this.props.documents.forEach(function(d, i) {
            docTopicsCSV += '"' + d.id + '",' + d.topicCounts.map((x) => { return d3.format(".8")(x / d.tokens.length); }).join(",") + "\n";
        });
      
        // Download file
        this.saveFile("docTopics.csv",docTopicsCSV,"text/csv");
    }
      
    saveTopicWords = () => {
        var topicWordsCSV = "word," + d3
            .range(0, this.props.numTopics)
            .map(function(t) {return "Topic " + t; } )
            .join(",") + "\n";
        for (let word in this.props.wordTopicCounts) {
            // Strip double quotes because CSV readers can't agree how to deal
            // with them.
            word = this.sterilizeWord(word);

            let topicProbabilities = zeros(this.props.numTopics);
            for (let topic in this.props.wordTopicCounts[word]) {
                topicProbabilities[topic] = this.eightDigits(
                    this.props.wordTopicCounts[word][topic] / 
                    this.props.tokensPerTopic[topic]);
            }
            topicWordsCSV += '"' + word + '",' + topicProbabilities.join(",") + "\n";
        }
      
        this.saveFile("topicWords.csv",topicWordsCSV,"text/csv");
    }
      
    saveTopicKeys = () => {
        var keysCSV = "Topic,Annotation,TokenCount,Words\n";
      
        if (this.props.topicWordCounts.length === 0) { this.props.sortTopicWords(); }
      
            for (var topic = 0; topic < this.props.numTopics; topic++) {
                let annotation = this.props.annotations[topic] ? this.props.annotations[topic]: "";
                keysCSV += topic + "," + annotation + "," + this.props.tokensPerTopic[topic] + 
                ",\"" + topNWords(this.props.topicWordCounts[topic], 10)
                + "\"\n";
            }
      
        this.saveFile("topicKeys.csv",keysCSV,"text/csv")
    }
      
    /**
     * @summary downloads a csv of topic - topic pointwise mutual information.
     */
    saveTopicPMI = () => {
        // Add top row of column names
        var pmiCSV = "Topic Number";
        for(let i = 0; i < this.props.numTopics; i++) {
            pmiCSV += "," + i;
        }
        pmiCSV += "\n";

        var matrix = this.props.getTopicCorrelations();
        matrix.forEach((row,i) => { 
            // Insert topic number
            pmiCSV += i + ",";

            // Insert PMI values
            pmiCSV += row.map((x) => { 
                return this.eightDigits(x); 
            }).join(",") + "\n"; 
        });

        this.saveFile("topicCorrelations.csv",pmiCSV,"text/csv");
    }
      
    saveGraph = () => {
        var graphCSV = "Source,Target,Weight,Type\n";
      
        this.props.documents.forEach((d, i) => {
            d.topicCounts.forEach((x, topic) => {
                if (x > 0.0) {
                graphCSV += '"' + d.id + '",' + topic + "," + this.eightDigits(x / d.tokens.length) + ",undirected\n";
                }
            });
        });

        this.saveFile("documentGraph.csv",graphCSV,"text/csv");
    }
      
    saveState = () => {
        var state = "DocID,Word,Topic\n";
        this.props.documents.forEach((d, docID) => {
            d.tokens.forEach((token, position) => {
                if (! token.isStopword) {
                    state += docID + ",\"" + this.sterilizeWord(token.word) + "\"," + token.topic + "\n";
                }
            });
        });

        this.saveFile("state.csv",state,"text/csv");
    }

    /**
     * @summary Saves a given file to the user's computer.
     * @param {String} fileName Name of file to be saved. Including extension
     * @param {String} fileContents Contents of file to be saved
     * @param {String} fileType Type of file to be saved
     */
    saveFile(fileName, fileContents, fileType) {   
        saveFile(fileName, fileContents, fileType);
    }
}

export default DLPage;
