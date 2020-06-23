class LDAModel {
    constructor() {
        // Needed by reset & parseline
        vocabularySize = 0;

        // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
        correlationMinTokens = 2;
        correlationMinProportion = 0.05;


        // needed by reset & parseline, changeNumTopics
        vocabularyCounts = {};

        //needed by reset
        sortVocabByTopic = false;
        this.specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);

        wordPattern = XRegExp("\\p{L}[\\p{L}\\p{P}]*\\p{L}", "g");

        // Topic model parameters

        // needed by reset & sortTopicWords, changeNumTopics
        this.numTopics = 0; // run findNumTopics upon mount

        // required by reset & ready & parseline
        this.stopwords = {};

        // required by reset, changeNumTopics
        this.completeSweeps = 0;
        this.requestedSweeps = 0;

        // in reset, changeNumTopics

        selectedTopic = 0;

        // Needed by reset & parseline & sortTopicWords, changeNumTopics
        this.wordTopicCounts = {};

        // Needed by reset & sortTopicWords, changeNumTopics
        this.topicWordCounts = [];

        // Needed by reset & parseline, changeNumTopics
        this.tokensPerTopic = []; // set to zeros(numTopics)

        // in reset, changeNumTopics
        this.topicWeights = []; // set to zeros(numTopics)

        // Array of dictionaries with keys 
        // {"originalOrder", "id", "date", "originalText", "tokens", "topicCounts"}
        // used by reset & parseline, changeNumTopics
        this.documents = [];

        this.timer = 0; // used in sweep
        this.documentTopicSmoothing = 0.1; // (used by sweep)
        this.topicWordSmoothing = 0.01; // (used by sweep)
    }

    _byCountDescending(a,b) { return b.count - a.count; };

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

    }

    addStop() {

    }

    removeStop() {

    }

    getTopicCorrelations() {

    }

    addSweepRequest() {

    }
}