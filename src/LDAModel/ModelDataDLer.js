import {topNWords, zeros, saveFile} from '../funcs/utilityFunctions'
import * as d3 from "d3"

/**
 * A class that allows users to download information about an LDA model
 * @author Theo Bayard de Volo
 */
export default class LDAModelDataDLer {
    /**
     * A class that allows users to download information about an LDA model
     * @param {LDAModel} model the model to dl data from
     * @param {Ojbect} annotationHolder an object that has an annotations
     * member variable with an array of topic annotations
     * @note Okay yes, annotationHolder is a weird object to pass.
     * But, App likes to change the refference of the annotations, so
     * that reference cannot be passed. This ensures the correct annotations
     * are used.
     */
    constructor(model, annotationHolder) {
        this._model = model;
        this._annotationHolder = annotationHolder;
    }

    get _annotations() {
        return this._annotationHolder.annotations;
    }

    /**
     * Function to prevent a word from messing up CSVs.
     * Mostly, quotations need to be stripped.
     * @param {String} w word to sterilize
     */
    _sterilizeWord(w) {
        return w.replace(/"/g, "");
    }

    /**
     * Truncates number to 8 digits
     */
    _eightDigits = d3.format(".8");

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
        for (let topic = 0; topic < this._model.numTopics; topic++) {
            var topicProportions = this._model.documents
                .map(function (d) {
                    return {
                        date: d.date,
                        p: d.topicCounts[topic] / d.tokens.length
                    };
                });
            var topicMeans = d3
                .nest()
                .key(function (d) {
                    return d.date;
                })
                .rollup(function (d) {
                    return d3
                        .mean(d, function (x) {
                            return x.p
                        });
                })
                .entries(topicProportions);

            // Add column names on first pass
            if (topic === 0) {
                for (let i = 0; i < topicMeans.length; i++) {
                    topicTimeCSV += ',"' + topicMeans[i].key.replace('"', '') + '"'
                }
                topicTimeCSV += "\n"
            }

            // Add topic Number
            topicTimeCSV += topic + ",";

            // Add mean values
            for (let i = 0; i < topicMeans.length; i++) {
                topicTimeCSV += topicMeans[i].value + ",";
            }
            topicTimeCSV = topicTimeCSV.slice(0, -1); // Remove last comma
            topicTimeCSV = topicTimeCSV += "\n";
        }

        saveFile("topicsTime.csv", topicTimeCSV, "text/csv");
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
        for (let i = 0; i < this._model.numTopics; i++) {
            docTopicsCSV += ",Topic " + i;
        }
        docTopicsCSV += "\n";

        // Add rows of each document's topic values
        this._model.documents.forEach(function (d, i) {
            docTopicsCSV += '"' + d.id + '",' + d.topicCounts.map((x) => {
                return d3.format(".8")(x / d.tokens.length);
            }).join(",") + "\n";
        });

        // Download file
        saveFile("docTopics.csv", docTopicsCSV, "text/csv");
    }

    /**
     * CSV of word topic counts.
     * - Columns:
     *  - word: word of row,
     *  - one column for every topic: number of times word is assigned to each topic
     */
    saveTopicWords = () => {
        var topicWordsCSV = "word," + d3
            .range(0, this._model.numTopics)
            .map(function (t) {
                return "Topic " + t;
            })
            .join(",") + "\n";
        for (let word in this._model.wordTopicCounts) {
            // Strip double quotes because CSV readers can't agree how to deal
            // with them.
            word = this._sterilizeWord(word);

            let topicProbabilities = zeros(this._model.numTopics);
            for (let topic in this._model.wordTopicCounts[word]) {
                topicProbabilities[topic] = this._eightDigits(
                    this._model.wordTopicCounts[word][topic] /
                    this._model.tokensPerTopic[topic]);
            }
            topicWordsCSV += '"' + word + '",' + topicProbabilities.join(",") + "\n";
        }

        saveFile("topicWords.csv", topicWordsCSV, "text/csv");
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

        if (this._model.topicWordCounts.length === 0) {
            this._model.sortTopicWords();
        }

        for (var topic = 0; topic < this._model.numTopics; topic++) {
            let annotation = this._annotations[topic] ? this._annotations[topic] : "";
            keysCSV += topic + "," + annotation + "," + this._model.tokensPerTopic[topic] +
                ",\"" + topNWords(this._model.topicWordCounts[topic], 10)
                + "\"\n";
        }

        saveFile("topicKeys.csv", keysCSV, "text/csv")
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
        for (let i = 0; i < this._model.numTopics; i++) {
            pmiCSV += "," + i;
        }
        pmiCSV += "\n";

        var matrix = this._model.getTopicCorrelations();
        matrix.forEach((row, i) => {
            // Insert topic number
            pmiCSV += i + ",";

            // Insert PMI values
            pmiCSV += row.map((x) => {
                return this._eightDigits(x);
            }).join(",") + "\n";
        });

        saveFile("topicCorrelations.csv", pmiCSV, "text/csv");
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
                    graphCSV += '"' + d.id + '",' + topic + "," + this._eightDigits(x / d.tokens.length) + ",undirected\n";
                }
            });
        });

        saveFile("documentGraph.csv", graphCSV, "text/csv");
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
                if (!token.isStopword) {
                    state += d.id + ",\"" + this._sterilizeWord(token.word) + "\"," + token.topic + "\n";
                }
            });
        });

        saveFile("state.csv", state, "text/csv");
    }

    /**
     * Downloads the json for active LDAModel object
     */
    downloadModel = () => {
        const fileName = "jsLDA_Model.json";
        const json = JSON.stringify(this._model);
        const fileType = 'application/json'
        saveFile(fileName, json, fileType)
    }

    /**
     * Downloads a txt file of all stopwords with one stopword per line
     */
    downloadStopwords = () => {
        let stopwordFile = ""
        Object.keys(this._model.stopwords).forEach(stopword => {
            stopwordFile += stopword + "\n";
        })
        let fileName = "stopwords.txt"
        let fileType = "text/txt";
        saveFile(fileName, stopwordFile, fileType);
    }

    /**
     * Downloads a CSV with the average topic value for every topic - catagory
     * pair in metaField
     * @param {String} metaField The data field of interest
     *
     * - Columns:
     *  - Topic: the topic associated with a row
     *  - For every catagory - catagory label: the average topic proportion for
     *    documents with that label.
     */
    topicBarDownload = (metaField) => {
        // get the list of categories without needing to parse entire form again
        var sel = document.getElementById("categorySelect").options;

        var categories = []
        for (let i = 0; i < sel.length; i++) {
            categories.push(sel[i].text);
        }

        var barPlotCSV = "";
        barPlotCSV += "Topic";
        for (let i = 0; i < categories.length; i++) {
            barPlotCSV += ", " + categories[i];
        }
        barPlotCSV += "\n"

        // First gather all the data for current md field.
        let all_data = []
        for (let i = 0; i < categories.length; i++) {
            let averages = this._model.topicAvgsForCatagory(
                metaField, categories[i]);

            let data = []
            for (let [topic, value] of Object.entries(averages)) {
                let topicLabel = "[" + topic + "] " + topNWords(
                    this._model.topicWordCounts[topic], 3);
                data.push({"label": topicLabel, "value": value})
            }
            all_data.push(data)
        }

        // fill in data, by key
        for (let j = 0; j < this._model.numTopics; j++) {
            barPlotCSV += all_data[0][j]["label"];
            for (let i = 0; i < categories.length; i++) {
                barPlotCSV += ", " + all_data[i][j]["value"];

            }
            barPlotCSV += "\n"
        }
        var fileName = "barPlot.csv"
        let fileType = "text/csv";
        saveFile(fileName, barPlotCSV, fileType);
    }

    /**
     * Downloads a CSV with the average topic value for every topic - catagory pair in
     * metaField
     * @param {String} metaField The data field of interest
     * - Columns:
     *  - [metaField]: The metaField catagory for the row
     *  - for every topic - topic x: the the average proportion of that topic
     *    over every document in that catagory.
     */
    barPlotValueDownload = (metaField) => {

        // First gather all the data for current md field.
        let all_data = []
        for (let i = 0; i < this._model.numTopics; i++) {
            let averages = this._model.metaTopicAverages(
                metaField, i);
            let data = []
            for (let [key, value] of Object.entries(averages)) {
                data.push({"label": key, "value": value})


            }
            all_data.push(data)
        }


        // add heading to csv
        var barPlotCSV = "";
        barPlotCSV += metaField;
        for (let i = 0; i < this._model.numTopics; i++) {
            barPlotCSV += ", topic " + i;
        }
        barPlotCSV += "\n"

        // fill in data, by key
        for (let j = 0; j < all_data[0].length; j++) {
            barPlotCSV += all_data[0][j]["label"];
            for (let i = 0; i < this._model.numTopics; i++) {
                barPlotCSV += ", " + all_data[i][j]["value"];
            }
            barPlotCSV += "\n"
        }

        var fileName = metaField + ".csv";
        let fileType = "text/csv";
        saveFile(fileName, barPlotCSV, fileType);

    }
}
