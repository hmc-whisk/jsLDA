import {topNWords, zeros, saveFile} from '../funcs/utilityFunctions'

/**
 * A class that allows users to download information about an LDA model
 */
export default class LDAModelDataDLer {
    /**
     * A class that allows users to download information about an LDA model
     * @param {LDAModel} model the model to dl data from
     */
    constructor(model) {
        this._model = model;
    }

    /**
     * Function to prevent a word from messing up CSVs.
     * Mostly, quotations need to be stripped.
     * @param {String} w word to sterilize
     */
    sterilizeWord(w) {
        return w.replace(/"/g,"");
    }

    /**
     * Truncates number to 8 digits
     */
    eightDigits = d3.format(".8");

    /**
     * CSV of topics over time
     * - Columns:
     *  - Topic Number
     *  - One column for every date - ISO date: mean topic proportion over docs from date  
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

        saveFile("topicsTime.csv",topicTimeCSV,"text/csv");
    }

    /**
     * CSV with proportion of every topic in every document.
     * - Columns:
     *  - Document ID: id of document for row
     *  - One col for every topic - Topic X: (tokens assigned to topic)/(tokens in doc)
     */
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
        saveFile("docTopics.csv",docTopicsCSV,"text/csv");
    }

    /**
     * CSV of word topic counts. 
     * - Columns: 
     *  - word: word of row, 
     *  - one column for every topic: number of times word is assigned to each topic
     */
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
      
        saveFile("topicWords.csv",topicWordsCSV,"text/csv");
    }
      
    /**
     * CSV of highlevel topic information.
     * - Columns: 
     *  - Topic: topic number 
     *  - Annotation: user annotation
     *  - TokenCount: number of tokens assigned to topic
     *  - Words: top 10 words
     */
    saveTopicKeys = () => {
        var keysCSV = "Topic,Annotation,TokenCount,Words\n";
      
        if (this.props.topicWordCounts.length === 0) { this.props.sortTopicWords(); }
      
            for (var topic = 0; topic < this.props.numTopics; topic++) {
                let annotation = this.props.annotations[topic] ? this.props.annotations[topic]: "";
                keysCSV += topic + "," + annotation + "," + this.props.tokensPerTopic[topic] + 
                ",\"" + topNWords(this.props.topicWordCounts[topic], 10)
                + "\"\n";
            }
      
        saveFile("topicKeys.csv",keysCSV,"text/csv")
    }
      
    /**
     * Downloads a csv of topic - topic pointwise mutual information.
     * - Columns:
     *  - Topic Number: the topic number for a row
     *  - One column for every topic: the PMI between column and row topic
     */
    saveTopicPMI = () => {
        // Add top row of column names
        var pmiCSV = "Topic Number";
        for(let i = 0; i < this._model.numTopics; i++) {
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

        saveFile("topicCorrelations.csv",pmiCSV,"text/csv");
    }
    
    /**
     * A doc-topics graph file formated for the program Gephi
     * - Colunms:
     *  - Source: Document ID
     *  - Target: Topic Number
     *  - Weight: Proportion of tokens in given doc assigned to given topic
     *  - Type: The type of graph connection (always undirected)
     */
    saveGraph = () => {
        var graphCSV = "Source,Target,Weight,Type\n";

        this._model.documents.forEach((d) => {
            d.topicCounts.forEach((x, topic) => {
                if (x > 0.0) {
                graphCSV += '"' + d.id + '",' + topic + "," + this.eightDigits(x / d.tokens.length) + ",undirected\n";
                }
            });
        });

        saveFile("documentGraph.csv",graphCSV,"text/csv");
    }
      
    /**
     * Save CSV with the topic assignment for every token.
     * - Columns: 
     *  - DocID: doc word token is in
     *  - Word: symbol of token
     *  - Topic: num of topic token is assigned to
     */
    saveState = () => {
        var state = "DocID,Word,Topic\n";
        this._model.documents.forEach((d) => {
            d.tokens.forEach((token) => {
                if (! token.isStopword) {
                    state += d.id + ",\"" + this.sterilizeWord(token.word) + "\"," + token.topic + "\n";
                }
            });
        });

        saveFile("state.csv",state,"text/csv");
    }

    downloadModel = () => {
        const fileName = "jsLDA_Model.json";
        const json = JSON.stringify(this._model);
        const fileType = 'application/json'
        saveFile(fileName,json,fileType)   
    }

}