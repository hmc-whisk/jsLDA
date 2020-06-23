
import {zeros, getObjectKeys} from '../../funcs/utilityFunctions'
import * as d3 from 'd3';
// This adds the Object.keys() function to some old browsers that don't support it
if (!Object.keys) {
    Object.keys = (getObjectKeys());
}

/**
 * @summary Creates/maintains a topic model over a corpus
 */
class LDAModel {
    constructor() {
        // Needed by reset & parseline
        this._vocabularySize = 0;

        // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
        this._correlationMinTokens = 2;
        this._correlationMinProportion = 0.05;


        // needed by reset & parseline, changeNumTopics
        this._vocabularyCounts = {};

        //needed by reset
        this._sortVocabByTopic = false;
        this._this.specificityScale = d3.scaleLinear().domain([0, 1]).range(["#ffffff", "#99d8c9"]);

        this._wordPattern = XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g");

        // Topic model parameters

        // needed by reset & sortTopicWords, changeNumTopics
        this._numTopics = 0; // run findNumTopics upon mount

        // required by reset & ready & parseline
        this._stopwords = {};

        // required by reset, changeNumTopics
        this._completeSweeps = 0;
        this._requestedSweeps = 0;

        // in reset, changeNumTopics

        _selectedTopic = 0;

        // Needed by reset & parseline & sortTopicWords, changeNumTopics
        this._wordTopicCounts = {};

        // Needed by reset & sortTopicWords, changeNumTopics
        this._topicWordCounts = [];

        // Needed by reset & parseline, changeNumTopics
        this._tokensPerTopic = []; // set to zeros(numTopics)

        // in reset, changeNumTopics
        this._topicWeights = []; // set to zeros(numTopics)

        // Array of dictionaries with keys 
        // {"originalOrder", "id", "date", "originalText", "tokens", "topicCounts"}
        // used by reset & parseline, changeNumTopics
        this._documents = [];

        this._timer = 0; // used in sweep
        this._documentTopicSmoothing = 0.1; // (used by sweep)
        this._topicWordSmoothing = 0.01; // (used by sweep)

        this._sweeps = 0; // (used by addSweepRequest) for finding whether an additional sweep call should be called
    }

    /**
     * @summary function to sort by Object's count attribute
     * @param {Object} a 
     * @param {Object} b 
     */
    _byCountDescending(a, b) { return b.count - a.count; };

    /**
     * @summary Truncates s to <= 300 characters
     * @param {String} s text to be truncated
     */
    _truncate(s) { 
        return s.length > 300 ? s.substring(0, 299) + "..." : s; 
    };

    /**
     * @summary Resets data members in preperation
     * for new documents to be processed
     */
    _reset() {
        this._vocabularySize = 0;
        this._vocabularyCounts = {};
        this._sortVocabByTopic = false;
        this._specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);
        this._stopwords = {};
        this._completeSweeps = 0;
        this._requestedSweeps = 0;
        this._selectedTopic = -1;
        this._wordTopicCounts = {};
        this._topicWordCounts = [];
        this._tokensPerTopic = zeros(this._numTopics);
        this._topicWeights = zeros(this._numTopics);
        this._documents = [];
    }

    /**
     * @summary Sets up state from document/stopword info
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
            stops.split(/\s+/).forEach((w) => {this._stopwords[w] = 1; });
        
            // Load documents and populate the vocabulary
            this._parseDoc(doc);
        
            this._sortTopicWords();
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
     * This function calles upon the documentType state member
     * to determine whether docText is a csv or tsv. If it isnt
     * "text/csv" then it will assume it is a tsv.
     */
    _parseDoc = (docText) => {
        tokensPerTopic = zeros(this.state.numTopics);

        var parsedDoc
        if(this.state.documentType === "text/csv") {
            parsedDoc = d3.csvParseRows(docText);
        } else {
            parsedDoc = d3.tsvParseRows(docText);
        }
        
        // Handle empty documents
        if(parsedDoc.length===0){
            alert("Document file is empty");
            return;
        }

        let columnInfo = this.getColumnInfo(parsedDoc[0]);

        // Handle no text colunm
        if(columnInfo["text"] === -1) {
            alert("No text column found in document file");
            return;
        }

        for(let i = 1; i < parsedDoc.length; i++) {
            let fields = parsedDoc[i];
            // Set fields based on whether they exist
            var docID = columnInfo.id === -1 ? 
                this._documents.length : 
                fields[columnInfo.id];
            var docDate = columnInfo.date_tag === -1 ? 
                "" : 
                fields[columnInfo.date_tag];
            var text = fields[columnInfo.text];
            
            var tokens = [];
            var rawTokens = text.toLowerCase().match(XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g"));
            if (rawTokens == null) { continue; }
            var topicCounts = zeros(this._numTopics);
            rawTokens.forEach(function (word) {
                if (word !== "") {
                var topic = Math.floor(Math.random() * (this._numTopics));
            
                if (word.length <= 2) { this._stopwords[word] = 1; }
            
                var isStopword = this._stopwords[word];
                if (isStopword) {
                    // Record counts for stopwords, but nothing else
                    if (! this._vocabularyCounts[word]) {
                    this._vocabularyCounts[word] = 1;
                    }
                    else {
                    this._vocabularyCounts[word] += 1;
                    }
                }
                else {
                    _tokensPerTopic[topic]++;
                    if (! this._wordTopicCounts[word]) {
                    this._wordTopicCounts[word] = {};
                    this._vocabularySize++;
                    this._vocabularyCounts[word] = 0;
                    }
                    if (!this._wordTopicCounts[word][topic]) {
                    this._wordTopicCounts[word][topic] = 0;
                    }
                    this._wordTopicCounts[word][topic] += 1;
                    this._vocabularyCounts[word] += 1;
                    topicCounts[topic] += 1;
                }
                tokens.push({"word":word, "topic":topic, "isStopword":isStopword });
                }
            });

            let metadata = {}
            for (const [key, index] of Object.entries(columnInfo["metadata"])) {
                metadata[key] = fields[index];
            }

            this._documents.push({ 
                "originalOrder" : this._documents.length,
                "id" : docID,
                "date" : docDate,
                "originalText" : text,
                "tokens" : tokens,
                "topicCounts" : topicCounts,
                "metadata" : metadata
            });

            // Need to move this selection and adding to #docs-page into a different component
            d3.select("div#docs-page").append("div")
                .attr("class", "document")
                .text("[" + docID + "] " + this.truncate(text));
        }

    }

    _sortTopicWords() {

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
     * @summary Shifts model to have a dif number of topics
     * @param {Number} numTopics new number of topics
     */
    changeNumTopics(numTopics) {
        this._numTopics = numTopics;
        this._selectedTopic = -1;
        this._topicWordCounts = [];
        this._tokensPerTopic = zeros(this._numTopics);
        this._topicWeights = zeros(this._numTopics);
        this._wordTopicCounts = {};
        this._completeSweeps = 0;
        this._requestedSweeps = 0;

        d3.select("#iters").text(this._completeSweeps);
        
        Object.keys(this.state.vocabularyCounts).forEach(function (word) { this._wordTopicCounts[word] = {} });

        this._documents.forEach(( currentDoc, i ) => {
            currentDoc.topicCounts = zeros(this._numTopics);
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                let token = currentDoc.tokens[position];
                token.topic = Math.floor(Math.random() * this._numTopics);
                
                if (! token.isStopword) {
                    this._tokensPerTopic[token.topic]++;
                if (! this._wordTopicCounts[token.word][token.topic]) {
                    this._wordTopicCounts[token.word][token.topic] = 1;
                }
                else {
                    this._wordTopicCounts[token.word][token.topic] += 1;
                }
                currentDoc.topicCounts[token.topic] += 1;
                }
            }
        });
 
        this.sortTopicWords()
    }

    /**
     * @summary completes one training iteration
     */
    _sweep() {
        var startTime = Date.now();
    
        var topicNormalizers = zeros(this._numTopics);
        for (let topic = 0; topic < this._numTopics; topic++) {
          topicNormalizers[topic] = 1.0 / 
          (this._vocabularySize * this._topicWordSmoothing + 
            this._tokensPerTopic[topic]);
        }
    
        for (let doc = 0; doc < this._documents.length; doc++) {
          let currentDoc = this._documents[doc];
          let docTopicCounts = currentDoc.topicCounts;
    
          for (let position = 0; position < currentDoc.tokens.length; position++) {
            let token = currentDoc.tokens[position];
            if (token.isStopword) { continue; }
    
            this._tokensPerTopic[ token.topic ]--;
            let currentWordTopicCounts = this._wordTopicCounts[ token.word ];
            currentWordTopicCounts[ token.topic ]--;
            if (currentWordTopicCounts[ token.topic ] === 0) {
            }
            docTopicCounts[ token.topic ]--;
            topicNormalizers[ token.topic ] = 1.0 / 
              (this._vocabularySize * this._topicWordSmoothing +
                this._tokensPerTopic[ token.topic ]);
    
            let sum = 0.0;
            for (let topic = 0; topic < this._numTopics; topic++) {
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
    
            this._tokensPerTopic[ token.topic ]++;
    
            if (! currentWordTopicCounts[ token.topic ]) {
              currentWordTopicCounts[ token.topic ] = 1;
            }
            else {
              currentWordTopicCounts[ token.topic ] += 1;
            }
            docTopicCounts[ token.topic ]++;
    
            topicNormalizers[ token.topic ] = 1.0 / 
              (this._vocabularySize * this._topicWordSmoothing +
              this._tokensPerTopic[ token.topic ]);
          }
        }
    
        console.log("sweep in " + (Date.now() - startTime) + " ms");
        this.completeSweeps += 1;    

        // TODO: Update completed sweeps outside of this function
        d3.select("#iters").text(this.completeSweeps);
    
        if (this.completeSweeps >= this.requestedSweeps) {
          this.update = true;
          this.sortTopicWords();
          this.timer.stop();
          this.sweeps = 0;
        }
    }

    /**
     * @summary adds a word to model's stoplist
     * @param {String} word the word to be added to stoplist
     */
    addStop = (word) => {  
        this._stopwords[word] = 1;
        this._vocabularySize--;
        delete this._wordTopicCounts[word];

        this._documents.forEach( function( currentDoc, i ) {
            var docTopicCounts = currentDoc.topicCounts;
            for (var position = 0; position < currentDoc.tokens.length; position++) {
                var token = currentDoc.tokens[position];
                if (token.word === word) {
                    token.isStopword = true;
                    this._tokensPerTopic[ token.topic ]--;
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
        delete this._stopwords[word];
        this._vocabularySize++;
        this._wordTopicCounts[word] = {};
        var currentWordTopicCounts = this._wordTopicCounts[ word ];
        
        this._documents.forEach( function( currentDoc, i ) {
            var docTopicCounts = currentDoc.topicCounts;
            for (var position = 0; position < currentDoc.tokens.length; position++) {
                var token = currentDoc.tokens[position];
                if (token.word === word) {
                    token.isStopword = false;
                    this._tokensPerTopic[ token.topic ]++;
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
        this._sortTopicWords();
    }

    getTopicCorrelations() {
        // initialize the matrix
        let correlationMatrix = [this._numTopics];
        for (var t1 = 0; t1 < this._numTopics; t1++) {
            correlationMatrix[t1] = zeros(this._numTopics);
        }

        var topicProbabilities = zeros(this._numTopics);

        // iterate once to get mean log topic proportions
        this.documents.forEach((d, i) => {

            // We want to find the subset of topics that occur with non-trivial concentration in this document.
            // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
            var documentTopics = [];
            var tokenCutoff = Math.max(this._correlationMinTokens,
                this.correlationMinProportion * d.tokens.length);

            for (let topic = 0; topic < this._numTopics; topic++) {
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

        for (let t1 = 0; t1 < this._numTopics - 1; t1++) {
            for (let t2 = t1 + 1; t2 < this._numTopics; t2++) {
                correlationMatrix[t1][t2] = Math.log((this._documents.length * correlationMatrix[t1][t2]) /
                    (topicProbabilities[t1] * topicProbabilities[t2]));
                correlationMatrix[t2][t1] = Math.log((this._documents.length * correlationMatrix[t2][t1]) /
                    (topicProbabilities[t1] * topicProbabilities[t2]));
            }
        }

        return correlationMatrix;
    }

    addSweepRequest(parameter) {

        this._requestedSweeps += parameter

        if (this._sweeps === 0) {
            this._sweeps = 1;
            this._timer = d3.timer(this._sweep);
            console.log("Requested Sweeps Now: " + this._requestedSweeps);
        }
    }
}

export default LDAModel;