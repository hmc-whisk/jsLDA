
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

        this.wordTopicCounts = {};

        this.topicWordCounts = [];

        this.tokensPerTopic = zeros(this.numTopics);

        this._topicWeights = zeros(this.numTopics);

        // Array of dictionaries with keys 
        // {"originalOrder", "id", "date", "originalText", "tokens", "topicCounts", "metadata"}
        this.documents = [];

        this._timer = 0; // used in sweep
        this._documentTopicSmoothing = 0.1; // (used by sweep)
        this._topicWordSmoothing = 0.01; // (used by sweep)

        this._sweeps = 0; // (used by addSweepRequest) for finding whether an additional sweep call should be called

        this.documentType = "text/csv";
        this.modelIsRunning = false;
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
        this.wordTopicCounts = {};
        this.topicWordCounts = [];
        this.tokensPerTopic = zeros(this.numTopics);
        this._topicWeights = zeros(this.numTopics);
        this.documents = [];
        d3.select("#iters").text(this._completeSweeps);
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
            
            var tokens = [];
            var rawTokens = text.toLowerCase().match(this._wordPattern);
            if (rawTokens == null) { continue; }
            var topicCounts = zeros(this.numTopics);
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
     * @summary returns the number of time the word most assigned to
     * the selected topic was assigned
     */
    get highestWordTopicCount() {
        if(this.selectedTopic===-1) return 0;
        return this.topicWordCounts[this.selectedTopic][0]["count"]
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
        return this.pTopicGivenWord(w,t)*Math.log(
            this.pTopicGivenWord(w,t)/this.pTopic(t))
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
    maxTopicSaliency = (t) => {
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
     * @summary Shifts model to have a dif number of topics
     * @param {Number} numTopics new number of topics
     */
    changeNumTopics(numTopics) {
        this.numTopics = numTopics;
        this.selectedTopic = -1;
        this.topicWordCounts = [];
        this.tokensPerTopic = zeros(this.numTopics);
        this._topicWeights = zeros(this.numTopics);
        this.wordTopicCounts = {};
        this._completeSweeps = 0;
        this._requestedSweeps = 0;

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
     * @summary completes one training iteration
     */
    _sweep = () => {
        var startTime = Date.now();
        var topicNormalizers = zeros(this.numTopics);
        for (let topic = 0; topic < this.numTopics; topic++) {
          topicNormalizers[topic] = 1.0 / 
          (this._vocabularySize * this._topicWordSmoothing + 
            this.tokensPerTopic[topic]);
        }
    
        for (let doc = 0; doc < this.documents.length; doc++) {
          let currentDoc = this.documents[doc];
          let docTopicCounts = currentDoc.topicCounts;
    
          for (let position = 0; position < currentDoc.tokens.length; position++) {
            let token = currentDoc.tokens[position];
            if (token.isStopword) { continue; }
    
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
                  (this._documentTopicSmoothing + docTopicCounts[topic]) *
                  (this._topicWordSmoothing + currentWordTopicCounts[ topic ]) *
                topicNormalizers[topic];
              }
              else {
                this._topicWeights[topic] =
                  (this._documentTopicSmoothing + docTopicCounts[topic]) *
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
          this.updateWebpage();
        }
    }

    get iterations() {
        return this._completeSweeps;
    }

    /**
     * @summary adds a word to model's stoplist
     * @param {String} word the word to be added to stoplist
     */
    addStop = (word) => {  
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
        this.sortTopicWords();
    }

    /**
     * @summary removes a word from stoplist
     * @param {String} word the word to remove
     */
    removeStop = (word) => {
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
        this.sortTopicWords();
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
        for (const [key,_] of Object.entries(this.documents[0].metadata)){
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
}

export default LDAModel;