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
        _this.specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);

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

export default LDAModel;