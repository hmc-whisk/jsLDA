
import {zeros, getObjectKeys, truncate} from '../funcs/utilityFunctions'
import * as d3 from 'd3';
var XRegExp = require('xregexp');

// This adds the Object.keys() function to some old browsers that don't support it
if (!Object.keys) {
    Object.keys = (getObjectKeys());
}

/**
 * @summary Creates/maintains a topic model over a corpus
 * @param {Number} numTopics the starting 
 * @param {Function} forceUpdate callback that updates the webpage
 */
class LDAModel {
    // Duplicate docstrings so my IDE shows it on hover
    /**
     * @summary Creates/maintains a topic model over a corpus
     * @param {Number} numTopics the starting number of topics
     * @param {Function} forceUpdate callback that updates the webpage
     */
    constructor(numTopics, forceUpdate) {

        this._vocabularySize = 0;

        // Constants for calculating topic correlation. 
        // A doc with 5% or more tokens in a topic is "about" that topic.
        this._correlationMinTokens = 2;
        this._correlationMinProportion = 0.05;

        this.vocabularyCounts = {};

        this.sortVocabByTopic = false;
        this._specificityScale = d3.scaleLinear().domain([0, 1]).range(["#ffffff", "#99d8c9"]);

        this._wordPattern = XRegExp("\\p{L}(\\p{P}?\\p{L})+", "g");

        // Topic model parameters

        this.numTopics = numTopics;

        this.updateWebpage = forceUpdate

        this.stopwords = {};

        this._completeSweeps = 0;
        this._requestedSweeps = 0;

        this.selectedTopic = 0;
        this.topicVisibility = {};

        this.wordTopicCounts = {};

        this.topicWordCounts = [];

        this.tokensPerTopic = zeros(this.numTopics);

        this._topicWeights = zeros(this.numTopics);

        this.docLengthCounts = [];

        this.topicDocCounts = [];

        // parameters used for the bigram option
        this.bigram = false;
        this.bigramInitialized = false;
        this.bigramCount = {};
        this.bigramCountRev = {};
        this.bigramWord1Count = {};
        this.bigramWord2Count = {};
        this.totalBigramCount = 0;
        this.finalBigram = {};
        this.finalBigramRev = {};
        this.bigramThreshold = 10.828; // Threshold for exceeding critical value 0.001

        // Array of dictionaries with keys 
        // {"originalOrder", "id", "date", "originalText", "tokens", "topicCounts", "metadata"}
        this.documents = [];

        this._timer = 0; // used in sweep
        this._documentTopicSmoothing = zeros(numTopics).fill(0.1); // (used by sweep)
        this._topicWordSmoothing = 0.01; // (used by sweep)

        this._sweeps = 0; // (used by addSweepRequest) for finding whether an additional sweep call should be called

        this.documentType = "text/csv";
        this.modelIsRunning = false;

        this._optimizeInterval = 50;
        this._burninPeriod = 200;
        this._changeAlpha = false;
    }

    static DOC_SORT_SMOOTHING = 10.0;

    get tokenRegex() {
        return this._wordPattern;
    }

    setTokenRegex = (newRegex) => {
        console.log(`setting tokenizer to ${newRegex.xregexp.source}`);
        this._wordPattern = newRegex; 
        this.updateWebpage();
    }


    /**
     * Used to set the type of file LDAModel will
     * treat a documents file as
     * @param {String} type 
     */
    setDocumentType = (type) => {
        this.documentType = type;
    }

    // Used by sidebar to change selectedTopic and sortVocabByTopic
    selectedTopicChange = (topic) => {
        this.selectedTopic = topic;
        if (topic === -1) {
            this.sortVocabByTopic = false;
        }
        this.updateWebpage();
    }

    sortbyTopicChange = (sort) => {
        this.sortVocabByTopic = sort
        this.updateWebpage();
    }

    /**
     * @summary function to sort by Object's count attribute
     * @param {Object} a 
     * @param {Object} b 
     */
    byCountDescending(a, b) { return b.count - a.count; };

    /**
     * @summary Resets data members in preparation
     * for new documents to be processed
     */
    reset() {
        this.modelIsRunning = false;
        this._vocabularySize = 0;
        this.vocabularyCounts = {};
        this.sortVocabByTopic = false;
        this._specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);
        this.stopwords = {};
        this._completeSweeps = 0;
        this._requestedSweeps = 0;
        this.selectedTopic = -1;
        this.topicVisibility = this.initTopicVisibility(this.numTopics);
        this.wordTopicCounts = {};
        this.topicWordCounts = [];
        this.tokensPerTopic = zeros(this.numTopics);
        this._topicWeights = zeros(this.numTopics);
        this.documents = [];
        this._memoMinDocTime = null;
        this._memoMaxDocTime = null;
        this._maxTopicSaliency = new Array(this.numTopics)
        d3.select("#iters").text(this._completeSweeps);
    }

    /**
     * @summary Initializes this.topicVisibility dict with every topic
     *          number having "default" visibility
     * @param {Number} this.numTopics the number of topics in
     * current model
     */
    initTopicVisibility = (numTops) => {
        let visDict = {};
        for (const n of Array(numTops).keys()) {
            visDict[n] = "default";
        }
        return visDict;
    }

    /**
     * @summary Initializes this.topicVisibility dict with every topic
     *          number having "default" visibility
     * @param {Number} topicNum the number of the topic 
     * @param {String} visibility the new visibility state of the
     * topic ("default", "pinned", or "hidden")
     */
    setTopicVisibility = (topicNum, visibility) => {
        this.topicVisibility[topicNum] = visibility;
    }

    /**
     * @summary Sets up model from document/stopword info
     * @param {Error} error
     * @param {String} stops string of stop words with one per line
     * @param {String} doc string of documents in tsv or csv format
     *  - Lines should not have column names included
     *  - See parseDoc for
     */
    ready = (error, stops, doc) => {
        if (error) { 
            //alert("File upload failed. Please try again."); TODO: uncomment this for deployment
            throw error;
        } else {
            // Create the stoplist
            stops.split(/\s+/).forEach((w) => {this.stopwords[w] = 1; });
        
            // Load documents and populate the vocabulary
            this._parseDoc(doc);
        
            this.sortTopicWords();
        }
    }

    /**
     * @summary Processes document text to set up topic model
     * @param docText {String} a string of a tsv or csv file
     *  - With column names
     *    - a "text" column with the document text is required
     *    - an "id" column will be used for document ids
     *    - a "tag" column will be used to sort/group documents by date
     *    - all other columns are assumed to be metadata
     * This function calls upon the documentType object member
     * to determine whether docText is a csv or tsv. If it isn't
     * "text/csv" then it will assume it is a tsv.
     */
    _parseDoc = (docText) => {
        this.tokensPerTopic = zeros(this.numTopics);

        var parsedDoc
        if(this.documentType === "text/csv") {
            parsedDoc = d3.csvParseRows(docText);
        } else {
            parsedDoc = d3.tsvParseRows(docText);
        }
        
        // Handle empty documents
        if(parsedDoc.length===0){
            alert("Document file is empty");
            return;
        }

        let columnInfo = this._getColumnInfo(parsedDoc[0]);

        // Handle no text column
        if(columnInfo["text"] === -1) {
            alert("No text column found in document file");
            return;
        }

        for(let i = 1; i < parsedDoc.length; i++) {
            let fields = parsedDoc[i];
            // Set fields based on whether they exist
            var docID = columnInfo.id === -1 ? 
                this.documents.length : 
                fields[columnInfo.id];
            var docDate = columnInfo.date_tag === -1 ? 
                "" : 
                fields[columnInfo.date_tag];
            var text = fields[columnInfo.text];
            let tokens = [];
            var rawTokens = this.getRawTokens(text)
            if (rawTokens == null) { continue; }
            let topicCounts = zeros(this.numTopics);

            rawTokens.forEach((word) => {
                if (word !== "") {
                var topic = Math.floor(Math.random() * (this.numTopics));
            
                if (word.length <= 2) { this.stopwords[word] = 1; }
            
                var isStopword = this.stopwords[word];
                if (isStopword) {
                    // Record counts for stopwords, but nothing else
                    if (! this.vocabularyCounts[word]) {
                    this.vocabularyCounts[word] = 1;
                    }
                    else {
                    this.vocabularyCounts[word] += 1;
                    }
                }
                else {

                    this.tokensPerTopic[topic]++;
                    if (! this.wordTopicCounts[word]) {
                    this.wordTopicCounts[word] = {};
                    this._vocabularySize++;
                    this.vocabularyCounts[word] = 0;
                    }
                    if (!this.wordTopicCounts[word][topic]) {
                    this.wordTopicCounts[word][topic] = 0;
                    }
                    this.wordTopicCounts[word][topic] += 1;
                    this.vocabularyCounts[word] += 1;
                    topicCounts[topic] += 1;
                }
                tokens.push({"word":word, "topic":topic, "isStopword":isStopword });
                }
            });

            let metadata = {}
            for (const [key, index] of Object.entries(columnInfo["metadata"])) {
                metadata[key] = fields[index];
            }

            this.documents.push({ 
                "originalOrder" : this.documents.length,
                "id" : docID,
                "date" : docDate,
                "originalText" : text,
                "tokens" : tokens,
                "topicCounts" : topicCounts,
                "metadata" : metadata,
                "dateObject" : new Date(docDate)
            });

            // Need to move this selection and adding to #docs-page into a different component
            d3.select("div#docs-page").append("div")
                .attr("class", "document")
                .text("[" + docID + "] " + truncate(text));
        }

    }

    /**
     * @summary Processes bigrams in documents
     * @param docText {String} a string of a tsv or csv file
     *  - With column names
     *    - a "text" column with the document text is required
     *    - an "id" column will be used for document ids
     *    - a "tag" column will be used to sort/group documents by date
     *    - all other columns are assumed to be metadata
     * This function calls upon the documentType object member
     * to determine whether docText is a csv or tsv. If it isn't
     * "text/csv" then it will assume it is a tsv.
     * The function acts to process through all potential bigrams
     */
    _parseBigram = (docText) => {
        var parsedDoc
        if(this.documentType === "text/csv") {
            parsedDoc = d3.csvParseRows(docText);
        } else {
            parsedDoc = d3.tsvParseRows(docText);
        }
        
        // Handle empty documents
        if(parsedDoc.length===0){
            alert("Document file is empty");
            return;
        }

        let columnInfo = this._getColumnInfo(parsedDoc[0]);

        // Handle no text column
        if(columnInfo["text"] === -1) {
            alert("No text column found in document file");
            return;
        }

        for(let i = 1; i < parsedDoc.length; i++) {
            let fields = parsedDoc[i];
            // Set fields based on whether they exist
            var text = fields[columnInfo.text];
            
            var rawTokens = text.toLowerCase().match(this._wordPattern);
            if (rawTokens == null) { continue; }
            var prevWord = ""; 

            rawTokens.forEach((word) => {
                if (word !== "") {
                    if (word.length <= 2) { this.stopwords[word] = 1; }
                
                    var isStopword = this.stopwords[word];
                    if (isStopword) {
                        prevWord = "";
                    }
                    else {
                        if (prevWord) {
                            if (! this.bigramCount[prevWord]) {
                            this.bigramCount[prevWord] = {};
                            this.bigramWord1Count[prevWord] = 0;
                            }

                            if (! this.bigramCountRev[word]) {
                                this.bigramCountRev[word] = {};
                                }
                            
                            if (!this.bigramCount[prevWord][word]) {
                                this.bigramCount[prevWord][word] = 0;
                                }
                            
                            if (!this.bigramCountRev[word][prevWord]) {
                                this.bigramCountRev[word][prevWord] = 0;
                                }
                            
                            if (!this.bigramWord2Count[word]) {
                                this.bigramWord2Count[word] = 0;
                                }

                            this.bigramCount[prevWord][word] += 1;
                            this.bigramCountRev[word][prevWord] += 1;
                            this.bigramWord1Count[prevWord] += 1;
                            this.bigramWord2Count[word]+= 1;
                            this.totalBigramCount += 1;
                            }
                    }
                    prevWord = word;
                }
            });
            }
            this.scoreBigram();
            this.bigramInitialized = true;
            this._changeBigramStatus(true);
        }

    sortTopicWords() {
            this.topicWordCounts = [];
            for (let topic = 0; topic < this.numTopics; topic++) {
                this.topicWordCounts[topic] = [];
            }
            for (let word in this.wordTopicCounts) {
              for (let topic in this.wordTopicCounts[word]) {
                this.topicWordCounts[topic].push({"word":word, "count":this.wordTopicCounts[word][topic]});
              }
            }
          
            for (let topic = 0; topic < this.numTopics; topic++) {
                this.topicWordCounts[topic].sort(this.byCountDescending);
            }
        this.updateWebpage();
    }

    /**
     * This function carries out the necessary functions after a model is uploaded
     */
    modelUploaded = () => {
        console.log("Corrected Model")
        // Date Objects get uploaded as strings not object, and thus must be remade
        this._remakeDateObjects()
    }

    /**
     * Creates a new dateObject for every document based on their date variable
     */
    _remakeDateObjects() {
        this.documents = this.documents.map((doc) => {
            doc.dateObject = new Date(doc.date)
            return doc
        })
    }

    /**
     * @summary Parses column names to get column index info
     * @param {Array<String>} header an array of column names
     * @returns {Object} {"id":index, "text":index, "date_tag":index, 
     *  "metadata": {"columnName1":index,..."columnNameN":index}}
     */
    _getColumnInfo(header) {
        let columnInfo = {"metadata":{}};
        let lookFor = ["id","text","date_tag"]; // special columns
        let columnIsMetadata = Array(header.length).fill(true);
        header = header.map((s) => s.toLocaleLowerCase());

        // Process special columns
        for (let columnName of lookFor){
            let index = header.indexOf(columnName);
            columnInfo[columnName] = index;

            if(index !== -1) {
                columnIsMetadata[index] = false; 
            }
        }
        // Process metadata
        for (let i = 0; i < header.length; i++) {
            if(columnIsMetadata[i]) {
                // Add this column to metadata object
                columnInfo["metadata"][header[i]]=i;
            }
        }
        return columnInfo;
    }

    /**
     * @summary documents sorted in order of the prevalence 
     * of the selected topic
     */
    get sortedDocuments() {
        const selectedTopic = this.selectedTopic;
        const sumDocSortSmoothing = LDAModel.DOC_SORT_SMOOTHING * this.numTopics;
        let sortedDocuments = this.documents;

        // Return default order if no topic is selected
        if (this.selectedTopic === -1) return sortedDocuments;

        sortedDocuments = sortedDocuments.map(function (doc, i) {
            doc["score"] = 
                (doc.topicCounts[selectedTopic] + LDAModel.DOC_SORT_SMOOTHING)/
                (doc.tokens.length + sumDocSortSmoothing)
            return doc
        });
        sortedDocuments.sort(function(a, b) {
            return b.score - a.score;
        });
        return sortedDocuments;
    }

    /**
     * @summary returns the number of time the word most assigned to
     * the selected topic was assigned
     */
    get highestWordTopicCount() {
        if(this.selectedTopic===-1) return 0;
        return this.topicWordCounts[this.selectedTopic][0]["count"]
    }

    /**
     * lazy getter for the Date object of the earliest document
     * @note memo stored in this._memoMinDocTime
     */
    get minDocTime() {
        // If already calculated, return that
        if(this._memoMinDocTime) return this._memoMinDocTime 

        // Protect against no documents
        if(!this.documents[0]) {
            console.log("Tried to get minDocTime without any documents")
            return null;
        }

        let minTime = this.documents[0].dateObject
        // Iterate through docs and keep min found time
        this.documents.forEach((doc) => {
            minTime = Math.min(minTime, doc.dateObject)
        })
        this._memoMinDocTime = new Date(minTime)
        return this._memoMinDocTime
    }

    /**
     * Lazily loaded Date object for the latest document
     * @note memo stored in this._memoMaxDocTime
     */
    get maxDocTime() {
        // If already calculated, return that
        if(this._memoMaxDocTime) return this._memoMaxDocTime 

        // Protect against no documents
        if(!this.documents[0]) {
            console.log("Tried to get maxDocTime without any documents")
            return null;
        }

        let maxTime = this.documents[0].dateObject
        // Iterate through docs and keep min found time
        this.documents.forEach((doc) => {
            maxTime = Math.max(maxTime, doc.dateObject)
        })
        this._memoMaxDocTime = new Date(maxTime)
        return this._memoMaxDocTime
    }

    /**
     * @summary scores bigrams according to chi-squared test and total frequency
     * and adds to finalBigram if deemed valid.
     * https://tedboy.github.io/nlps/_modules/nltk/metrics/association.html#BigramAssocMeasures.chi_sq
     */
    scoreBigram() {
        var tempFinalBigram = {};
        var tempFinalBigramRev = {};
        for (var word1 in this.bigramCount){
            tempFinalBigram[word1] = {};
            for (var word2 in this.bigramCount[word1]) {
                var n_oo = this.totalBigramCount;
                var n_ii = this.bigramCount[word1][word2];
                var n_io = this.bigramWord1Count[word1];
                var n_oi = this.bigramWord2Count[word2];

                var score = n_oo *((n_ii*n_oo - n_io*n_oi)**2 /
                        ((n_ii + n_io) * (n_ii + n_oi) * (n_io + n_oo) * (n_oi + n_oo)))

             // check to see if more than 20 occurance in total
                var scoreCheck = score > this.bigramThreshold;
                var freqCheck = n_ii > 20;
                if (scoreCheck && freqCheck) {
                    tempFinalBigram[word1][word2] = 1;
                    if (!tempFinalBigramRev[word2]) {
                        tempFinalBigramRev[word2] = {};
                    }
                    tempFinalBigramRev[word2][word1] = 1;
                }
            }
        }
        this.finalBigram = tempFinalBigram;
        this.finalBigramRev = tempFinalBigramRev;
    }

     * A function for getting the location of tokens in a string
     * @param {String} text the document object you'd like to parse
     * @returns An iterable set of match Objects with tokens that
     * match LDAModel.tokenRegex. match[0] yields the string matched
     * and match.index yields the location in the text where it matched
     */
    getRawTokensWithIndices(text) {
        let tokens = text.toLowerCase().matchAll(this.tokenRegex)
        return tokens
    }

    /**
     * 
     * @param {String} text 
     * @returns An array of strings in text that match LDAModel.tokenRegex
     */
    getRawTokens(text) {
        return text.toLowerCase().match(this.tokenRegex)
    }

    /**
     * Get the salience and location of every token in some text
     * @param {String} text the text to parse
     * @param {Number} topic the topic to get saliency for
     * @returns {[{string:String,salience:Number,startIndex:Number}]} 
     */
    textToTokenSaliences(text,topic) {
        const tokensItter = this.getRawTokensWithIndices(text)
        const tokens = [...tokensItter]
        return tokens.map((token) => {
            return {
                string: token[0],
                salience: this.topicSaliency(token[0],topic),
                startIndex: token.index
            }
        })
    }

    /**
     * A function to get the average token salience in a text
     * @param {String} text text to parse
     * @param {Number} topic topic to get salience of
     * @returns {Number} the average token salience in text for topic
     */
    textSalience(text,topic) {
        const tokensSals = this.textToTokenSaliences(text,topic)
        const addSal = (sumSals, token) => (token.salience+sumSals)
        const totalSal = tokensSals.reduce(addSal,0)
        return totalSal/tokensSals.length
    }

    /**
     * @summary Computes the salience score of a word for a topic
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     * @description This calculation is an adaptation of Chuang et al's 2012 
     * work. It is calculated by multiplying the distinctiveness of a word in
     * a given topic, by the probability that any given word in a topic is w.
     */
    topicSaliency = (w,t) => {
        if(this.stopwords[w]===1) return 0;
        return this.topicDistinctiveness(w,t)*this.pWordGivenTopic(w,t);
    }

    /**
     * @summary Computes the distinctiveness of a word for a topic
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     * @description This calculation is an adaptation of Chuang et al's 2012 
     * work. It is described by them as "This formulation describes (in an 
     * information-theoretic sense) how informative the specific term w is 
     * for determining the generating topic, versus a randomly-selected term w.
     * For example, if a word w occurs in all topics, observing the word tells
     * us little about the document’s topical mixture; thus the word would 
     * receive a low distinctiveness score."
     */
    topicDistinctiveness = (w,t) => {
        if(this.stopwords[w]===1) return 0;
        let sigma = 1e-50; // To avoid a log of 0
        return this.pTopicGivenWord(w,t)*Math.log(
            this.pTopicGivenWord(w,t)/this.pTopic(t)+sigma)
    }

    /**
     * @summary the probability of a topic given a word
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     */
    pTopicGivenWord = (w,t) => {
        let smoother = 1;
        if(!this.wordTopicCounts[w]) return 0; // If it isnt a token
        let numWInT = this.wordTopicCounts[w][t];
        if(!numWInT) numWInT = 0;
        let totalWs = Object.keys(this.wordTopicCounts[w])
            .reduce((sum,key)=>sum+parseFloat(this.wordTopicCounts[w][key]||0),0);

        return (numWInT + smoother)/(totalWs + this.numTopics*smoother);
    }

    /**
     * @summary the probability of a word given a topic
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     */
    pWordGivenTopic = (w,t) => {
        if(!this.wordTopicCounts[w]) return 0; // If it isnt a token
        let numWInT = this.wordTopicCounts[w][t];
        if(!numWInT) numWInT = 0;
        let numTokensInT = this.tokensPerTopic[t];
        return numWInT/numTokensInT;
    }

    /**
     * @summary The probability of any word being assigned to topic t
     * @param {Number} t Topic to analyze
     */
    pTopic = (t) => {
        return 1/this.numTopics;
    }

    /**
     * @summary calculates the highest salience value for all tokens of topic t
     * @param {Number} t Topic to analyze
     * @description Parses at most the most common 1000 tokens in topic t
     * and returns the value of the highest salience.
     */
    _calcMaxTopicSaliency(t) {
        if (t===-1) return 0; // If no topic selected

        // Set to at most 1000
        let endIndex = 1000;
        if(endIndex > this.topicWordCounts[t].length) {
            endIndex = this.topicWordCounts[t].length;
        }
        // Calculate max Saliency
        let maxS = 0;
        for(let i = 0; i < endIndex; i++) {
            let salience = this.topicSaliency(this.topicWordCounts[t][i]["word"],t);
            if (salience > maxS) maxS = salience;
        }
        console.log("Calculated a maximum saliency of: " + maxS);
        return maxS;
    }

    /**
     * @summary Returns the highest salience value for all tokens of topic t
     * @param {Number} topicNum Topic to analyze
     * @description Check if the maxTopicSaliency for a given topic has already been 
     * calculated before calculating it. 
     */
    maxTopicSaliency = (topicNum) => {
        if(this._maxTopicSaliency[topicNum]) return this._maxTopicSaliency[topicNum];
        this._maxTopicSaliency[topicNum] = this._calcMaxTopicSaliency(topicNum);
        return this._maxTopicSaliency[topicNum];
    }

    /**
     * @summary Shifts model to have a dif number of topics
     * @param {Number} numTopics new number of topics
     */
    changeNumTopics(numTopics) {
        this.numTopics = numTopics;
        this.selectedTopic = -1;
        this.topicVisibility = this.initTopicVisibility(this.numTopics);
        this.topicWordCounts = [];
        this.tokensPerTopic = zeros(this.numTopics);
        this._topicWeights = zeros(this.numTopics);
        this.wordTopicCounts = {};
        this._completeSweeps = 0;
        this._requestedSweeps = 0;
        this._maxTopicSaliency = new Array(numTopics);
        this._documentTopicSmoothing = zeros(numTopics).fill(0.1);

        d3.select("#iters").text(this._completeSweeps);
        
        Object.keys(this.vocabularyCounts).forEach((word) => { this.wordTopicCounts[word] = {} });

        this.documents.forEach(( currentDoc, i ) => {
            currentDoc.topicCounts = zeros(this.numTopics);
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                let token = currentDoc.tokens[position];
                token.topic = Math.floor(Math.random() * this.numTopics);
                
                if (! token.isStopword) {
                    this.tokensPerTopic[token.topic]++;
                if (! this.wordTopicCounts[token.word][token.topic]) {
                    this.wordTopicCounts[token.word][token.topic] = 1;
                }
                else {
                    this.wordTopicCounts[token.word][token.topic] += 1;
                }
                currentDoc.topicCounts[token.topic] += 1;
                }
            }
        });
        this.sortTopicWords();
        this.updateWebpage();
    }

    /**
     * @summary Turns on/off hyptertuning option
     */
    hyperTune = (tune) => {
        if (this.modelIsRunning == false)
        this._changeAlpha = tune;
    }

    /**
     * @summary Turns on/off Bigrams option
     */
     _changeBigramStatus = (bigramStatus) => {
        if (bigramStatus) {
            this.addBigram();
        }
        else {
            this.removeBigram();
        }
        this.bigram = bigramStatus;
    }

    /**
     * @summary completes one training iteration
     */
    _sweep = () => {
        var startTime = Date.now();
        var topicNormalizers = zeros(this.numTopics);
        var doOptimizeAlpha = false;
        if (this._changeAlpha && this._completeSweeps > this._burninPeriod && this._optimizeInterval != 0 &&
          this._completeSweeps % this._optimizeInterval == 0)
          {doOptimizeAlpha = true;} 
        
        for (let topic = 0; topic < this.numTopics; topic++) {
          topicNormalizers[topic] = 1.0 / 
          (this._vocabularySize * this._topicWordSmoothing + 
            this.tokensPerTopic[topic]);
        }
    
        for (let doc = 0; doc < this.documents.length; doc++) {
          let currentDoc = this.documents[doc];
          let docTopicCounts = currentDoc.topicCounts;
          if (doOptimizeAlpha) {var docLength = 0;}
    
          for (let position = 0; position < currentDoc.tokens.length; position++) {
            let token = currentDoc.tokens[position];
            if (token.isStopword) { continue; }
            if (doOptimizeAlpha) {docLength++;}
    
            this.tokensPerTopic[ token.topic ]--;
            let currentWordTopicCounts = this.wordTopicCounts[ token.word ];
            currentWordTopicCounts[ token.topic ]--;
            if (currentWordTopicCounts[ token.topic ] === 0) {
            }
            docTopicCounts[ token.topic ]--;
            topicNormalizers[ token.topic ] = 1.0 / 
              (this._vocabularySize * this._topicWordSmoothing +
                this.tokensPerTopic[ token.topic ]);
    
            let sum = 0.0;
            for (let topic = 0; topic < this.numTopics; topic++) {
              if (currentWordTopicCounts[ topic ]) {
                this._topicWeights[topic] =
                  (this._documentTopicSmoothing[topic] + docTopicCounts[topic]) *
                  (this._topicWordSmoothing + currentWordTopicCounts[ topic ]) *
                topicNormalizers[topic];
              }
              else {
                this._topicWeights[topic] =
                  (this._documentTopicSmoothing[topic] + docTopicCounts[topic]) *
                  this._topicWordSmoothing *
                topicNormalizers[topic];
              }
              sum += this._topicWeights[topic];
    
            }
    
            // Sample from an unnormalized discrete distribution
            var sample = sum * Math.random();
              var i = 0;
              sample -= this._topicWeights[i];
              while (sample > 0.0) {
                i++;
                sample -= this._topicWeights[i];
            }
            token.topic = i;
    
            this.tokensPerTopic[ token.topic ]++;
    
            if (! currentWordTopicCounts[ token.topic ]) {
              currentWordTopicCounts[ token.topic ] = 1;
            }
            else {
              currentWordTopicCounts[ token.topic ] += 1;
            }
            docTopicCounts[ token.topic ]++;
    
            topicNormalizers[ token.topic ] = 1.0 / 
              (this._vocabularySize * this._topicWordSmoothing +
              this.tokensPerTopic[ token.topic ]);
              
          }
    
          if (doOptimizeAlpha) {
            this.docLengthCounts[docLength]++;
            for (let topic = 0; topic < this.numTopics; topic++) {
              this.topicDocCounts[topic][docTopicCounts[topic]]++;
            }
          }
        }

        if (doOptimizeAlpha) {
            // Values 1.001, 1.0 and 1 are from parameters used for ParallelTopicModel
            // in Mallet, 2/10/2021. 
            this._learnParameters(this._documentTopicSmoothing, this.topicDocCounts,
                this.docLengthCounts, 1.001, 1.0, 1);
        }

        console.log("sweep in " + (Date.now() - startTime) + " ms");
        this._completeSweeps += 1;    
    
        // TODO: Update completed sweeps outside of this function
        d3.select("#iters").text(this._completeSweeps);
    
        if (this._completeSweeps >= this._requestedSweeps) {
          this.update = true;
          this.sortTopicWords();
          this._timer.stop();
          this._sweeps = 0;
          this.modelIsRunning = false;
          this._maxTopicSaliency = new Array(this.numTopics);
          this.updateWebpage();
          console.log(this._documentTopicSmoothing);
        }
    }

    get iterations() {
        return this._completeSweeps;
    }

    /** 
     *  Gather statistics on the size of documents 
     *  and create histograms for use in Dirichlet hyperparameter
     *  optimization.
     */
    _initializeHistograms = () => {
        var maxTokens = 0;
        // var totalTokens = 0;
        var seqLen;

        for (let doc = 0; doc < this.documents.length; doc++) {
            let currentDoc = this.documents[doc];
            seqLen = currentDoc.tokens.length
            if (seqLen > maxTokens)
                maxTokens = seqLen;
            // totalTokens += seqLen;
        }

        console.log("max tokens: " + maxTokens);

        this.docLengthCounts = zeros(maxTokens + 1);

        // alternative would be to initialise the index in the
        // 2d array only after they are accessed
        this.topicDocCounts = zeros(this.numTopics);
        for (let i = 0; i < this.topicDocCounts.length; i++) {
            this.topicDocCounts[i] = zeros(maxTokens + 1);
        }
    }

    /** 
     * Learn Dirichlet parameters using frequency histograms, with an assumption of a Gamma distributions.
     * 
     * @param {Number[]} parameters A reference to the current values of the parameters, which will be updated in place
     * @param {Number[][]} observations An array of count histograms. <code>observations[10][3]</code> could be the number of documents that contain exactly 3 tokens of word type 10.
     * @param {Number[]} observationLengths A histogram of sample lengths, for example <code>observationLengths[20]</code> could be the number of documents that are exactly 20 tokens long.
     * @param {Number} shape Gamma prior E(X) = shape * scale, var(X) = shape * scale<sup>2</sup>
     * @param {Number} scale 
     * @param {Number} numIterations 200 to 1000 generally insures convergence, but 1-5 is often enough to step in the right direction
     * @returns The sum of the learned parameters.
     */ 
    _learnParameters = (parameters,
        observations,
        observationLengths,
        shape,
        scale,
        numIterations) => {

        var i;
        var k;
        var parametersSum = 0;

        // Initialize the parameter sum
        for (k = 0; k < parameters.length; k++) {
            parametersSum += parameters[k];
        }

        var oldParametersK;
        var currentDigamma;
        var denominator;

        var nonZeroLimit;
        var nonZeroLimits = zeros(observations.length).fill(-1);

        // The histogram arrays go up to the size of the largest document,
        //	but the non-zero values will almost always cluster in the low end.
        //	We avoid looping over empty arrays by saving the index of the largest
        //	non-zero value.

        var histogram;

        for (i=0; i<observations.length; i++) {
            histogram = observations[i];

            for (k = 0; k < histogram.length; k++) {
                if (histogram[k] > 0) {
                nonZeroLimits[i] = k;
                }
            }
        }

        for (let iteration=0; iteration<numIterations; iteration++) {

            // Calculate the denominator
            denominator = 0;
            currentDigamma = 0;

            // Iterate over the histogram:
            for (i=1; i<observationLengths.length; i++) {
                currentDigamma += 1 / (parametersSum + i - 1);
                denominator += observationLengths[i] * currentDigamma;
            }

            // Bayesian estimation Part I
            denominator -= 1/scale;

            // Calculate the individual parameters

            parametersSum = 0;

            for (k=0; k<parameters.length; k++) {

                // What's the largest non-zero element in the histogram?
                nonZeroLimit = nonZeroLimits[k];

                oldParametersK = parameters[k];
                parameters[k] = 0;
                currentDigamma = 0;

                histogram = observations[k];

                for (i=1; i <= nonZeroLimit; i++) {
                    currentDigamma += 1 / (oldParametersK + i - 1);
                    parameters[k] += histogram[i] * currentDigamma;
                }

                // Bayesian estimation part II
                parameters[k] = oldParametersK * (parameters[k] + shape) / denominator;

                parametersSum += parameters[k];
            }
        }

        if (parametersSum < 0.0) { throw "sum: " + parametersSum; }
        return parametersSum;
    }

    /**
     * @summary adds a word to model's stoplist
     * if the bigram option is on, we add bigrams that contain the stopword as well.
     * @param {String} word the word to be added to stoplist
     */
    addStop = (word) => {  
            this.addStopHelper(word);
            if (this.bigram) {
                for (let w in this.finalBigram[word]) {
                    this.addStopHelper(word+"_"+w)
                }
                for (let w in this.finalBigramRev[word]) {
                    this.addStopHelper(w+"_"+word)
                }
            }
    }

    /**
     * @summary adds a word to model's stoplist
     * @param {String} word the word to be added to stoplist
     */
     addStopHelper = (word) => { 
        if (!this.stopwords[word]) { 
        this.stopwords[word] = 1;
        this._vocabularySize--;
        delete this.wordTopicCounts[word];

        this.documents.forEach(( currentDoc, i ) => {
            var docTopicCounts = currentDoc.topicCounts;
            for (var position = 0; position < currentDoc.tokens.length; position++) {
                var token = currentDoc.tokens[position];
                if (token.word === word) {
                    token.isStopword = true;
                    this.tokensPerTopic[ token.topic ]--;
                    docTopicCounts[ token.topic ]--;
                }
            }
        });
        }
    }

    /**
     * @summary removes a word from stoplist
     * if the bigram option is on, we remove bigrams that contain the stopword as well.
     * @param {String} word the word to remove
     */
    removeStop = (word) => {
        this.removeStopHelper(word);
        if (this.bigram) {
            for (let w in this.finalBigram[word]) {
                if (this.stopwords[word+"_"+w] && !this.stopwords[w]) {
                    this.removeStopHelper(word+"_"+w)
                }
            }
            for (let w in this.finalBigramRev[word]) {
                if (this.stopwords[w+"_"+word] && !this.stopwords[w]) {
                    this.removeStopHelper(w+"_"+word)
                }
            }
        }
    }

    /**
     * @summary removes a word from stoplist
     * @param {String} word the word to remove
     */
     removeStopHelper = (word) => {
        delete this.stopwords[word];
        this._vocabularySize++;
        this.wordTopicCounts[word] = {};
        var currentWordTopicCounts = this.wordTopicCounts[ word ];
        
        this.documents.forEach(( currentDoc, i ) => {
            var docTopicCounts = currentDoc.topicCounts;
            for (var position = 0; position < currentDoc.tokens.length; position++) {
                var token = currentDoc.tokens[position];
                if (token.word === word) {
                    token.isStopword = false;
                    this.tokensPerTopic[ token.topic ]++;
                    docTopicCounts[ token.topic ]++;
                    if (! currentWordTopicCounts[ token.topic ]) {
                        currentWordTopicCounts[ token.topic ] = 1;
                    }
                    else {
                        currentWordTopicCounts[ token.topic ] += 1;
                    }
                }
            }
        });
    }

    /**
     * @summary Add bigrams to the model
     * Calls helper addBigramHelper on each bigram deemed valid in finalBigram.
     * After adding, we call addStop to every word in the stopwords to add bigram
     * to stopword if their constituent word is a stopword
     */
    addBigram = () => {
        for (let word1 in this.finalBigram) {
            if (!this.stopwords[word1]){
            for (let word2 in this.finalBigram[word1]) {
                if (!this.stopwords[word2]) {
                this.addBigramHelper(word1, word2);
            }
        }}}
        for (let w in this.stopwords) {
            if (this.stopwords[w]) {
                this.addStop(w);
            }
        }
        this.sortTopicWords();
    }

    /**
     * @summary Add bigrams to the model
     * @param {String} word1 first word of the bigram to add
     * @param {String} word1 second word of the bigram to add
     */
    addBigramHelper = (word1, word2) => {
        // Makes word1_word2 into a “word” by adding it to the wordTopicCounts, vocaburaryCounts, 
        // and increasing the vocaburarySize.
        var curBigram = word1+"_"+word2
        this.wordTopicCounts[curBigram] = {};
        this.vocabularyCounts[curBigram] = 0;
        var currentWordTopicCounts = this.wordTopicCounts[ curBigram ];
        this._vocabularySize++;
        
        this.documents.forEach(( currentDoc, i ) => {
            var docTopicCounts = currentDoc.topicCounts;
            var skipNext = false;
            var tempTokens = [];
            for (var position = 0; position < currentDoc.tokens.length; position++) {
                if (skipNext) {
                    skipNext = false;
                }
                else {
                var token = currentDoc.tokens[position];
                if (position==currentDoc.tokens.length-1) {tempTokens.push(token)}
                else {
                var nextToken = currentDoc.tokens[position+1];
                // We look for all occurrences of word1 followed directly by word2 in this.documents
                // Then, we replace the two tokens for word1 and word2 by one token for
                // word1_word2 in this.documents
                // For every bigram occurrence, we subtract the vocaburaryCounts of word 1
                // and word2 and add to the vocaburaryCounts of the bigram
                if (token.word == word1 && nextToken.word == word2) {
                    var random_boolean = Math.random() < 0.5;
                    this.wordTopicCounts[word1][token.topic]--;
                    this.wordTopicCounts[word2][nextToken.topic]--;
                    this.vocabularyCounts[curBigram]++;
                    this.vocabularyCounts[word1]--;
                    this.vocabularyCounts[word2]--;
                    // Half the time, we put the bigram in the same topic as word1,
                    // and half the time we put the bigram in the same topic as word2
                    if (random_boolean) {
                        this.tokensPerTopic[nextToken.topic]--;
                        docTopicCounts[nextToken.topic]--;
                        if (!currentWordTopicCounts[token.topic]) {
                            currentWordTopicCounts[token.topic] = 0;
                            }
                        currentWordTopicCounts[ token.topic ]+=1;
                        token.word = curBigram;
                        tempTokens.push(token);
                    }
                    else {
                        this.tokensPerTopic[token.topic]--;
                        docTopicCounts[token.topic]--;
                        if (!currentWordTopicCounts[nextToken.topic]) {
                            currentWordTopicCounts[nextToken.topic] = 0;
                            }
                        currentWordTopicCounts[ nextToken.topic ]+=1;
                        nextToken.word = curBigram;
                        tempTokens.push(nextToken);
                    }
                    skipNext = true;
                }
                else {
                    tempTokens.push(token)
                    }}
            }}
            currentDoc.tokens = tempTokens;
        })
    }

    /**
     * @summary Remove bigrams from the model
     * Calls helper removeBigramHelper on each bigram deemed valid in finalBigram.
     */
    removeBigram = () => {
        for (let word1 in this.finalBigram) {
            for (let word2 in this.finalBigram[word1]) {
                this.removeBigramHelper(word1, word2);
            }
        }
        this.sortTopicWords();
    }

    /**
     * @summary Remove bigrams to the model
     * @param {String} word1 first word of the bigram to remove
     * @param {String} word1 second word of the bigram to remove
     * We effectively reverse what was done in addBigramHelper. We replace word1_word2
     * token with two tokens, placing the words in the same topic as the bigram
     */
    removeBigramHelper = (word1, word2) => {
        var curBigram = word1+"_"+word2
        delete this.wordTopicCounts[curBigram];
        delete this.vocabularyCounts[curBigram];
        this._vocabularySize--;
        
        this.documents.forEach(( currentDoc, i ) => {
            var docTopicCounts = currentDoc.topicCounts;
            var tempTokens = [];
            for (var position = 0; position < currentDoc.tokens.length; position++) {
                var token = currentDoc.tokens[position];
                if (token.word == curBigram) {
                    this.wordTopicCounts[word1][token.topic]++;
                    this.wordTopicCounts[word2][token.topic]++;
                    this.vocabularyCounts[word1]++;
                    this.vocabularyCounts[word2]++;
                    docTopicCounts[token.topic]++;
                    token.word = word1;
                    token.isStopword = this.stopwords[word1];
                    tempTokens.push(token);
                    let isStopword = this.stopwords[word2];
                    tempTokens.push({"word":word2, "topic":token.topic, "isStopword":isStopword });
                }
                else {
                    tempTokens.push(token);
                    }
            }
            
            currentDoc.tokens = tempTokens;
        })
    }

    /**
     * @summary This function will compute pairwise correlations between topics.
     * @returns {Array<Array<Number>>} 2d array of correlation values
     * @description Unlike the correlated topic model (CTM) LDA doesn't have 
     * parameters that represent topic correlations. But that doesn't mean that
     * topics are not correlated, it just means we have to estimate those values
     * by measuring which topics appear in documents together.
     */
    getTopicCorrelations = () => {
        // initialize the matrix
        var correlationMatrix = new Array(this.numTopics);
        for (var t1 = 0; t1 < this.numTopics; t1++) {
            correlationMatrix[t1] = zeros(this.numTopics);
        }

        var topicProbabilities = zeros(this.numTopics);

        // iterate once to get mean log topic proportions
        this.documents.forEach((d, i) => {

            // We want to find the subset of topics that occur with non-trivial concentration in this document.
            // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
            var documentTopics = [];
            var tokenCutoff = Math.max(this._correlationMinTokens,
                this._correlationMinProportion * d.tokens.length);

            for (let topic = 0; topic < this.numTopics; topic++) {
                if (d.topicCounts[topic] >= tokenCutoff) {
                    documentTopics.push(topic);
                    topicProbabilities[topic]++; // Count the number of docs with this topic
                }
            }

            // Look at all pairs of topics that occur in the document.
            for (let i = 0; i < documentTopics.length - 1; i++) {
                for (let j = i + 1; j < documentTopics.length; j++) {
                    correlationMatrix[documentTopics[i]][documentTopics[j]]++;
                    correlationMatrix[documentTopics[j]][documentTopics[i]]++;
                }
            }
        });

        for (let t1 = 0; t1 < this.numTopics - 1; t1++) {
            for (let t2 = t1 + 1; t2 < this.numTopics; t2++) {
                correlationMatrix[t1][t2] = Math.log((this.documents.length * correlationMatrix[t1][t2]) /
                    (topicProbabilities[t1] * topicProbabilities[t2]));
                correlationMatrix[t2][t1] = Math.log((this.documents.length * correlationMatrix[t2][t1]) /
                    (topicProbabilities[t1] * topicProbabilities[t2]));
            }
        }
        return correlationMatrix;
    }

    /**
     * @summary Adds the appropriate number of sweeps to be performed
     * @param {Number} numRequests number of iterations to be requested
     */
    addSweepRequest(numRequests) {
        this.modelIsRunning = true;
        this.updateWebpage();

        // Protect against stopSweeps messing up _requestedSweeps
        if(this._requestedSweeps < this._completeSweeps) {
            this._requestedSweeps = this._completeSweeps;
        }

        this._requestedSweeps += numRequests 

        if (this._sweeps === 0) {
            this._sweeps = 1;
            this._timer = d3.timer(this._sweep);
            //hyperedit
            this._initializeHistograms();
            console.log("Requested Sweeps Now: " + this._requestedSweeps);
        }

        console.log("Has sweeped")
        
        
    }

    /**
     * @summary Stops the model from continuing it's sweeps
     */
    stopSweeps = () => {
        this._requestedSweeps = this._completeSweeps;
    }

    /**
     * @summary a list of the metadata fields in the model
     */
    get metaFields(){
        if(!this.documents[0]){
            throw(Error("No documents in model"));
        }
        
        let fields = []
        for (const [key,] of Object.entries(this.documents[0].metadata)){
            fields.push(key)
        }

        return fields
    }

    /**
     * @summary Returns all values in a metadata field
     * @param {String} field 
     * @returns {Array} Values in field
     */
    metaValues = (field) => {
        if(!this.metaFields.includes(field)){
            console.log("Given metadata field is not in model");
        }

        // Reduce to unique values
        return this.documents.reduce((values,doc) => {
            if(!values.includes(doc.metadata[field])) {
                values.push(doc.metadata[field])
            }
            return values
        },[])
    }

    /**
     * @summary Calculates the average topic value for every value 
     * in a metadata field
     * @param {String} field metadata field to get summary of
     * @param {*} topic topic number to get summary of
     */
    metaTopicAverages = (field,topic) => {
        if(!this.metaFields.includes(field)){
            throw(Error("Given metadata field is not in model"))
        }

        const metaValues = this.metaValues(field)
        let averages = {}
        for(let value of metaValues) {
            averages[value] = this.averageTopicValInCatagory(field,value,topic)
        }
        return averages;
    }

    /**
     * @summary Calculates the average value of a topic in a metadata category
     * @param {String} field The metavalue field category is in
     * @param {String} category The category to get average of
     * @param {Number} topic The number of the topic to get average of
     */
    averageTopicValInCatagory = (field, category, topic) => {
        // Reduce to scores of documents with this metadata value
        let topicScores = this.documents.reduce((scores,doc) => {
            // If in category add topic average
            if(doc.metadata[field] === category){
                scores.push(doc.topicCounts[topic]/doc.tokens.length)
            }
            return scores
        },[]);

        // Return the average
        return topicScores.reduce((a,b) => a + b, 0) / topicScores.length
    }

    /**
     * @summary The average topic values in a metadata category
     * @param {String} field Metadata field to category is in
     * @param {String} category Metadata category to analyze
     * @returns {Array<Number>} Average topic vals with index matching topic num
     */
    topicAvgsForCatagory = (field,category) => {
        let averages = []
        for(let topic = 0; topic < this.numTopics; topic++) {
            averages.push(this.averageTopicValInCatagory(field,category,topic))
        }
        return averages;
    }

    /**
     * @summary The topic and metadata[field] values for every document
     * @param {String} field Meta field to pull values of
     * @param {Number} topic Topic to pull values from
     * @returns {Array<{topicVal:Number,label:String,metaVal:any}>}
     */
    docTopicMetaValues = (field, topic) => {
        return this.documents.map((doc) => { return {
            topicVal:doc.topicCounts[topic]/doc.tokens.length,
            label: doc.id,
            metaVal: doc.metadata[field]
        }})
    }

    /**
     * @summary Calculates average topic value over numberToAvg closest
     * documents and then combines documents with the same time value
     * @param {Number} topic number of topic
     * @param {Number} numberToAvg number of documents to average over
     * @returns {Array<{key:Date,value:Number}>} rolling average topic
     * value over time
     */
    topicTimeRollingAvg = (topic,numberToAvg) => {
        numberToAvg = Math.max(numberToAvg,1);

        // Sort documents by time
        let documents = this.documents.sort((a,b) => a.dateObject-b.dateObject)

        // Calculate rolling average
        documents = documents.map((doc, i) => {
            // Control for out of bounds
            let startIndex = Math.max(0,Math.round(i-numberToAvg/2));
            let endIndex = Math.min(documents.length,Math.round(i+numberToAvg/2));
            // Gather values
            let vals = [];
            for(let j = startIndex; j < endIndex; j++) {
                vals.push(documents[j].topicCounts[topic]/
                    documents[j].tokens.length);
            }
            return {
                rollingAvg: vals.reduce((a,b) => a+b)/vals.length,
                date: doc.dateObject,
            }
        })

        // Combine documents with the same time stamp
        let topicMeans = d3
            .nest()
            .key(function (d) {return d.date; })
            .rollup(function (d) {return d3
                .mean(d, function (x) {return x.rollingAvg}); })
            .entries(documents);

        // Turn key back into Date object
        return topicMeans.map((d)=>{return{key:new Date(d.key),value:d.value}})
    }

    /**
     * Calculates the average topic value for numBins bins over time
     * @param {Number} topic number id of topic to get info for
     * @param {Number} numBins number of bins to devide timespan into
     * @param {Boolean} stdError whether or not to include stdError margin
     * @returns {Array<{key:Date,value:Number,upperEr:Number,lowerEr:Number}>} 
     * Array of average topic values. Entries are sorted by key. 
     * Date refers to the max date for that bin. upperEr/lowerEr are only
     * included if stdError is set to true.
     */
    topicTimesBinnedAverage = (topic, numBins, stdError=false) => {
        let bins = this.topicTimesBinned(topic, numBins)

        if(stdError) {
            bins = this.addStdErrorMargins(bins)
        }

        // Calc average for every bin
        bins.forEach((bin) => {
            const total = bin.value.reduce((a,b) => a + b,0);
            const avg = total/bin.value.length;
            bin.value = avg
        })
        return bins
    }

    /**
     * Function to add standard error margins to collections of values
     * @param {Array<{value:Array<Number}>} valArray array of dictionaries to
     * add stdError margins to. Must have value element.
     * @returns {Array<{value:Array<Number},upperEr:Number,lowerEr:Number>}
     * where upperEr/lowerEr are the margins of error of value at the 90%
     * confidence level.
     */
    addStdErrorMargins(valArray) {
        
        valArray = valArray.map((dict) => {
            const n = dict.value.length
            const mean = dict.value.reduce((a,b) => a + b) / n
            const stdDev = Math.sqrt(dict.value.map(
                x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
            const stdError = stdDev/Math.sqrt(n)
            const z = 1.645
            let newDict = {...dict}
            newDict.upperEr = mean + z*stdError
            newDict.lowerEr = Math.max(mean - z*stdError,0)
            return newDict
        })
        return valArray
    }

    /**
     * Calculates the average document values and groups them into numBin
     * bins over time
     * @param {Number} topic number id of topic to get info for
     * @param {Number} numBins number of bins to devide timespan into
     * @returns {Array<{key:Date,value:Array<Number>}>} Array of average 
     * topic values for every document in bin. Entries are sorted by key. 
     * Date refers to the max date for that bin.
     */
    topicTimesBinned = (topic, numBins) => {
        numBins = Math.max(numBins,1);
        
        // Make bins
        let timeSpan = this.maxDocTime - this.minDocTime;
        let binSize = Math.ceil(timeSpan/numBins); // ceil to make sure all docs have a bin

        let bins = []
        for(let binNum = 0; binNum < numBins; binNum++) {
            bins.push({
                key: new Date(this.minDocTime.valueOf() + binSize*(binNum+1)),
                value: []
            })
        }

        // Group topic values into bins
        let documents = this.documents.sort((a,b) => a.dateObject-b.dateObject)
        let currentBin = 0; // Keep track of which bin section of doc array we're in
        documents.forEach((doc) => {
            if(bins[currentBin].key < doc.dateObject) currentBin++;

            // Record average topic value for doc
            bins[currentBin].value.push(doc.topicCounts[topic]/
                doc.tokens.length)
        })

        return bins
    }
}

export default LDAModel;
