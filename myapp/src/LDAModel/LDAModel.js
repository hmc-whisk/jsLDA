import {zeros} from '../../funcs/utilityFunctions'
class LDAModel {
    constructor() {
        // Needed by reset & parseline
        _vocabularySize = 0;

        // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
        _correlationMinTokens = 2;
        _correlationMinProportion = 0.05;


        // needed by reset & parseline, changeNumTopics
        _vocabularyCounts = {};

        //needed by reset
        _sortVocabByTopic = false;
        _this.specificityScale = d3.scaleLinear().domain([0, 1]).range(["#ffffff", "#99d8c9"]);

        _wordPattern = XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g");

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

    _byCountDescending(a, b) { return b.count - a.count; };

    _reset() {

    }

    ready() {

    }

    _parseDoc() {

    }

    sortTopicWords() {

    }

    _getColumnInfo() {

    }

    changeNumTopics() {

    }

    _sweep() {
        var startTime = Date.now();

        // Avoid mutating state
        let temp_tokensPerTopic = this.tokenPerTopic.slice();
        let temp_topicWeights = this.topicWeight.slice();
        let temp_numTopics = this.numTopics;
        let temp_topicWordSmoothing = this.topicWordSmoothing;
        let temp_vocabularySize = this.vocabularySize;
        let temp_documents = this.documents
        let temp_wordTopicCounts = this.wordTopicCounts;
        let temp_documentTopicSmoothing = this.documentTopicSmoothing;
    
    
        var topicNormalizers = zeros(temp_numTopics);
        for (let topic = 0; topic < temp_numTopics; topic++) {
          topicNormalizers[topic] = 1.0 / 
          (temp_vocabularySize * temp_topicWordSmoothing + 
            temp_tokensPerTopic[topic]);
        }
    
        for (let doc = 0; doc < temp_documents.length; doc++) {
          let currentDoc = temp_documents[doc];
          let docTopicCounts = currentDoc.topicCounts;
    
          for (let position = 0; position < currentDoc.tokens.length; position++) {
            let token = currentDoc.tokens[position];
            if (token.isStopword) { continue; }
    
            temp_tokensPerTopic[ token.topic ]--;
            let currentWordTopicCounts = temp_wordTopicCounts[ token.word ];
            currentWordTopicCounts[ token.topic ]--;
            if (currentWordTopicCounts[ token.topic ] === 0) {
              //delete(currentWordTopicCounts[ token.topic ]);
            }
            docTopicCounts[ token.topic ]--;
            topicNormalizers[ token.topic ] = 1.0 / 
              (temp_vocabularySize * temp_topicWordSmoothing +
                temp_tokensPerTopic[ token.topic ]);
    
            let sum = 0.0;
            for (let topic = 0; topic < temp_numTopics; topic++) {
              if (currentWordTopicCounts[ topic ]) {
                temp_topicWeights[topic] =
                  (temp_documentTopicSmoothing + docTopicCounts[topic]) *
                  (temp_topicWordSmoothing + currentWordTopicCounts[ topic ]) *
                topicNormalizers[topic];
              }
              else {
                temp_topicWeights[topic] =
                  (temp_documentTopicSmoothing + docTopicCounts[topic]) *
                  temp_topicWordSmoothing *
                topicNormalizers[topic];
              }
              sum += temp_topicWeights[topic];
    
            }
    
            // Sample from an unnormalized discrete distribution
            var sample = sum * Math.random();
              var i = 0;
              sample -= temp_topicWeights[i];
              while (sample > 0.0) {
                i++;
                sample -= temp_topicWeights[i];
            }
            token.topic = i;
    
            temp_tokensPerTopic[ token.topic ]++;
    
            if (! currentWordTopicCounts[ token.topic ]) {
              currentWordTopicCounts[ token.topic ] = 1;
            }
            else {
              currentWordTopicCounts[ token.topic ] += 1;
            }
            docTopicCounts[ token.topic ]++;
    
            topicNormalizers[ token.topic ] = 1.0 / 
              (temp_vocabularySize * temp_topicWordSmoothing +
              temp_tokensPerTopic[ token.topic ]);
          }
        }
    
        console.log("sweep in " + (Date.now() - startTime) + " ms");
    
        this.tokenPerTopic = temp_tokensPerTopic;
        this.topicWeight = temp_topicWeights;
        this.completeSweeps += 1;    

        // TODO: Update completed sweeps outside of this function
        d3.select("#iters").text(this.completeSweeps);
    
        if (this.completeSweeps >= this.requestedSweeps) {
          this.tokensPerTopic = temp_tokensPerTopic;
          this.topicWeights = temp_topicWeights;
          this.update = true;

          this.sortTopicWords();
          this.timer.stop();
          this.sweeps = 0;
        }
      }

    addStop() {

    }

    removeStop() {

    }

    getTopicCorrelations() {
        // initialize the matrix
        let correlationMatrix = [this.numTopics];
        for (var t1 = 0; t1 < this.numTopics; t1++) {
            correlationMatrix[t1] = zeros(this.numTopics);
        }

        var topicProbabilities = zeros(this.numTopics);

        // iterate once to get mean log topic proportions
        this.documents.forEach((d, i) => {

            // We want to find the subset of topics that occur with non-trivial concentration in this document.
            // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
            var documentTopics = [];
            var tokenCutoff = Math.max(this.state.correlationMinTokens,
                this.state.correlationMinProportion * d.tokens.length);

            for (let topic = 0; topic < this.state.numTopics; topic++) {
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

        for (let t1 = 0; t1 < this.state.numTopics - 1; t1++) {
            for (let t2 = t1 + 1; t2 < this.state.numTopics; t2++) {
                correlationMatrix[t1][t2] = Math.log((this.state.documents.length * correlationMatrix[t1][t2]) /
                    (topicProbabilities[t1] * topicProbabilities[t2]));
                correlationMatrix[t2][t1] = Math.log((this.state.documents.length * correlationMatrix[t2][t1]) /
                    (topicProbabilities[t1] * topicProbabilities[t2]));
            }
        }

        return correlationMatrix;
    }

    addSweepRequest(parameter) {

        this._requestedSweeps += parameter

        if (this._sweeps === 0) {
            this._sweeps = 1;
            // this.topicWeight = this.state.topicWeights; I don't think this is necessary anymore
            // this.tokenPerTopic = this.state.tokensPerTopic;
            this.timer = d3.timer(this._sweep);
            console.log("Requested Sweeps Now: " + this.state.requestedSweeps);
        }
    }
}

export default LDAModel;