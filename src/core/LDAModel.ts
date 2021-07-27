import {zeros, getObjectKeys, truncate} from '../funcs/utilityFunctions'
import * as d3 from 'd3';
import XRegExp from "xregexp";
import {displayMessage} from "./message";

// This adds the Object.keys() function to some old browsers that don't support it
if (!Object.keys) {
    Object.keys = (getObjectKeys());
}

// type reverse-engineered from LDAModel.parseDoc
export type LDAToken = {
    word: string,
    topic: number,
    isStopword: boolean;
}

// type reverse-engineered from LDAModel.parseDoc
export type LDADocument = {
    originalOrder: number
    id: string | number,
    date: string,
    originalText: string,
    tokens: LDAToken[],
    topicCounts: number[],
    metadata: { [key: string]: string },
    dateObject: Date
}


export interface SortedLDADocument extends LDADocument {
    score: number
}

// type reverse-engineered from LDAModel._getColumnInfo
export type LDAColumnInfo = {
    metadata: { [key: string]: number },
    id: number,
    text: number,
    date_tag: number
};

// type reverse-engineered from LDAModel.setTopicVisibility
export type LDATopicVisibility = {
    [key: number]: "default" | "pinned" | "hidden"
}

// type reverse-engineered from LDAModel.topicTimesBinned
export type LDATopicTimeBin = {
    key: Date,
    value: number[]
}

// type reverse-engineered from LDAModel.addStdErrorMargins
export interface LDATopicTimeBinWithStd extends LDATopicTimeBin {
    upperEr: number,
    lowerEr: number
}

// type reverse-engineered from LDAModel.topicTimesBinnedAverage
export type LDATopicTimeBinAveraged = {
    key: Date,
    value: number
}

// type reverse-engineered from LDAModel.topicTimesBinnedAverage
export interface LDATopicTimeBinAveragedWithStd extends LDATopicTimeBinAveraged {
    upperEr: number,
    lowerEr: number
}

export type LDABigram = {
    [key: string]: {
        [key: string]: number
    }
}

/**
 * @summary Creates/maintains a topic model over a corpus
 * @param {Number} numTopics the starting
 * @param {Function} forceUpdate callback that updates the webpage
 */
export class LDAModel {
    // Duplicate docstrings so my IDE shows it on hover
    /**
     * @summary Creates/maintains a topic model over a corpus
     * @param {Number} numTopics the starting number of topics
     * @param {Function} forceUpdate callback that updates the webpage
     */

    _vocabularySize: number;
    _correlationMinTokens: number;
    _correlationMinProportion: number;
    _wordPattern: RegExp;
    _topicWeights: number[];

    sortVocabByTopic: boolean;
    vocabularyCounts: { [key: string]: number }; // reversed from _parseDoc
    numTopics: number;
    updateWebpage: () => void;
    stopwords: { [key: string]: 1 | undefined };
    selectedTopic: number;
    topicVisibility: LDATopicVisibility;
    wordTopicCounts: { [key: string]: { [key: number]: number } };  // reversed from _parseDoc
    topicWordCounts: { word: string, count: number }[][]; // reversed from sortTopicWords
    tokensPerTopic: number[];
    docLengthCounts: number[];
    topicDocCounts: number[][];

    bigram: boolean;
    bigramInitialized: boolean;
    bigramCount: LDABigram;
    bigramCountRev: LDABigram;
    bigramWord1Count: { [key: string]: number }
    bigramWord2Count: { [key: string]: number }
    totalBigramCount: number
    finalBigram: LDABigram
    finalBigramRev: LDABigram
    bigramThreshold: number
    documents: LDADocument []
    documentType: string;
    modelIsRunning: boolean;

    _specificityScale: d3.ScaleLinear<string, string>;

    scheduler: SweepScheduler;
    _documentTopicSmoothing: number[]; // alpha
    _topicWordSmoothing: number; // beta
    _optimizeInterval: number;
    _burninPeriod: number;
    _changeAlpha: boolean;
    _memoMinDocTime?: Date;
    _memoMaxDocTime?: Date;
    _maxTopicSaliency: number[];


    constructor(numTopics: number, forceUpdate: () => void) {

        this._vocabularySize = 0;

        // Constants for calculating topic correlation.
        // A doc with 5% or more tokens in a topic is "about" that topic.
        this._correlationMinTokens = 2;
        this._correlationMinProportion = 0.05;

        this.vocabularyCounts = {};

        this.sortVocabByTopic = false;
        this._specificityScale = d3.scaleLinear<string>().domain([0, 1]).range(["#ffffff", "#99d8c9"]);

        this._wordPattern = XRegExp("\\p{L}(\\p{P}?\\p{L})+", "g");

        // Topic model parameters

        this.numTopics = numTopics;

        this.updateWebpage = forceUpdate

        this.stopwords = {};

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

        this._documentTopicSmoothing = new Array(numTopics).fill(0.1); // (used by sweep)
        this._topicWordSmoothing = 0.01; // (used by sweep)


        this.documentType = "text/csv";
        this.modelIsRunning = false;

        this._optimizeInterval = 25;
        this._burninPeriod = 100;
        this._changeAlpha = false;

        this._maxTopicSaliency = new Array(this.numTopics)
        // this.selectedTopicChange.bind(this);

        this.scheduler = new SweepScheduler(this)
    }

    static DOC_SORT_SMOOTHING = 10.0;

    get tokenRegex(): RegExp {
        return this._wordPattern;
    }

    setTokenRegex(newRegex: RegExp) {
        // @ts-ignore xregexp ts.d file is wrong
        console.log(`setting tokenizer to ${newRegex.xregexp.source}`);
        this._wordPattern = newRegex;
        this.updateWebpage();
    }


    /**
     * Used to set the type of file LDAModel will
     * treat a documents file as
     * @param {String} fileName
     */
    setDocumentType(fileName: string) {
        const fileExtension = fileName.split('.').pop();
        if (fileExtension === "csv") {
            this.documentType = "text/csv";
        } else if (fileExtension === "tsv") {
            this.documentType = "text/tsv";
        } else if (fileExtension === "text/csv") { // need this case since documentType is set to "text/csv" by default
            this.documentType = "text/csv";
        } else if (fileExtension === "text/txt") { // need this case since documentType is set to "text/txt" by State of the Union default doc
            this.documentType = "text/tsv"; // previous implemention used text/tsv as documentType for SOTU doc
        } else {
            alert("Uploaded file does not have the correct extension (.csv or .tsv)");
        }
    }

    // Used by sidebar to change selectedTopic and sortVocabByTopic
    selectedTopicChange(topic: number) {
        this.selectedTopic = topic;
        if (topic === -1) {
            this.sortVocabByTopic = false;
        }
        this.updateWebpage();
    }

    sortByTopicChange(sort: boolean) {
        this.sortVocabByTopic = sort
        this.updateWebpage();
    }

    /**
     * @summary function to sort by Object's count attribute
     * @param {Object} a
     * @param {Object} b
     */
    byCountDescending(a: { count: number }, b: { count: number }) {
        return b.count - a.count;
    };

    /**
     * @summary Resets data members in preparation
     * for new documents to be processed
     */
    reset() {
        this.scheduler.stop();
        this._vocabularySize = 0;
        this.vocabularyCounts = {};
        this.sortVocabByTopic = false;
        this._specificityScale = d3.scaleLinear<string>().domain([0, 1]).range(["#ffffff", "#99d8c9"]);
        this.stopwords = {};
        this.selectedTopic = -1;
        this.topicVisibility = this.initTopicVisibility(this.numTopics);
        this.wordTopicCounts = {};
        this.topicWordCounts = [];
        this.tokensPerTopic = zeros(this.numTopics);
        this._topicWeights = zeros(this.numTopics);
        this.documents = [];
        this._memoMinDocTime = undefined;
        this._memoMaxDocTime = undefined;
        this._maxTopicSaliency = new Array(this.numTopics)
        this.scheduler.reset();
        displayMessage("Model has been reset", 2500);
    }

    /**
     * @summary Initializes this.topicVisibility dict with every topic
     *          number having "default" visibility
     * @param {Number} this.numTopics the number of topics in
     * current model
     */
    initTopicVisibility(numTops: number): LDATopicVisibility {
        let visDict: LDATopicVisibility = {};
        for (let i = 0; i < numTops; i++)
            visDict[i] = "default"
        return visDict;
    }

    /**
     * @summary Initializes this.topicVisibility dict with every topic
     *          number having "default" visibility
     * @param {Number} topicNum the number of the topic
     * @param {String} visibility the new visibility state of the
     * topic ("default", "pinned", or "hidden")
     */
    setTopicVisibility(topicNum: number, visibility: "default" | "pinned" | "hidden") {
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
    ready(error: Error | null, stops: string, doc: string) {
        if (error) {
            alert("File upload failed. Please try again.");
            throw error;
        } else {
            // Create the stoplist
            stops.split(/\s+/).forEach((w) => {
                this.stopwords[w] = 1;
            });

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
    _parseDoc(docText: string) {
        this.tokensPerTopic = zeros(this.numTopics);

        let parsedDoc: string[][];
        if (this.documentType === "text/csv") {
            parsedDoc = d3.csvParseRows(docText);
        } else if (this.documentType === "text/tsv") {
            parsedDoc = d3.tsvParseRows(docText);
        } else {
            throw(Error("File does not have a useable extension"));
        }

        // Handle empty documents
        if (parsedDoc.length === 0) {
            alert("Document file is empty");
            return;
        }

        let columnInfo = this._getColumnInfo(parsedDoc[0]);

        // Handle no text column
        if (columnInfo["text"] === -1) {
            alert("No text column found in document file");
            return;
        }

        for (let i = 1; i < parsedDoc.length; i++) {
            let fields = parsedDoc[i];
            // Set fields based on whether they exist
            let docID = columnInfo.id === -1 ?
                        this.documents.length :
                        fields[columnInfo.id];
            let docDate = columnInfo.date_tag === -1 ?
                          "" :
                          fields[columnInfo.date_tag];
            let text = fields[columnInfo.text];
            let tokens: LDAToken[] = [];
            let rawTokens = this.getRawTokens(text)
            if (rawTokens == null) {
                continue;
            }
            let topicCounts = zeros(this.numTopics);

            rawTokens.forEach((word) => {
                if (word !== "") {
                    let topic = Math.floor(Math.random() * (this.numTopics));

                    if (word.length <= 2) {
                        this.stopwords[word] = 1;
                    }

                    let isStopword = this.stopwords[word];
                    if (isStopword) {
                        // Record counts for stopwords, but nothing else
                        if (!this.vocabularyCounts[word]) {
                            this.vocabularyCounts[word] = 1;
                        } else {
                            this.vocabularyCounts[word] += 1;
                        }
                    } else {

                        this.tokensPerTopic[topic]++;
                        if (!this.wordTopicCounts[word]) {
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
                    tokens.push({word, topic, "isStopword": Boolean(isStopword)});
                }
            });

            let metadata: { [key: string]: string } = {}
            for (const [key, index] of Object.entries(columnInfo["metadata"])) {
                metadata[key] = fields[index];
            }

            this.documents.push({
                "originalOrder": this.documents.length,
                "id": docID,
                "date": docDate,
                "originalText": text,
                "tokens": tokens,
                "topicCounts": topicCounts,
                "metadata": metadata,
                "dateObject": new Date(docDate)
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
    _parseBigram(docText: string) {
        let parsedDoc
        if (this.documentType === "text/csv") {
            parsedDoc = d3.csvParseRows(docText);
        } else {
            parsedDoc = d3.tsvParseRows(docText);
        }

        // Handle empty documents
        if (parsedDoc.length === 0) {
            alert("Document file is empty");
            return;
        }

        let columnInfo = this._getColumnInfo(parsedDoc[0]);

        // Handle no text column
        if (columnInfo.text === -1) {
            alert("No text column found in document file");
            return;
        }

        for (let i = 1; i < parsedDoc.length; i++) {
            let fields = parsedDoc[i];
            // Set fields based on whether they exist
            let text = fields[columnInfo.text];

            let rawTokens = text.toLowerCase().match(this._wordPattern);
            if (rawTokens == null) {
                continue;
            }
            let prevWord = "";

            rawTokens.forEach((word) => {
                if (word !== "") {
                    if (word.length <= 2) {
                        this.stopwords[word] = 1;
                    }

                    let isStopword = this.stopwords[word];
                    if (isStopword) {
                        prevWord = "";
                    } else {
                        if (prevWord) {
                            if (!this.bigramCount[prevWord]) {
                                this.bigramCount[prevWord] = {};
                                this.bigramWord1Count[prevWord] = 0;
                            }

                            if (!this.bigramCountRev[word]) {
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
                            this.bigramWord2Count[word] += 1;
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
                this.topicWordCounts[topic].push({word, "count": this.wordTopicCounts[word][topic]});
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
    modelUploaded() {
        console.log("Corrected Model")
        // Date Objects get uploaded as strings not object, and thus must be remade
        this._remakeDateObjects()
    }

    /**
     * Creates a new dateObject for every document based on their date letiable
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
    _getColumnInfo(header: readonly string[]): LDAColumnInfo {
        let columnInfo:
            {
                metadata: { [key: string]: number },
                id: number, text: number,
                date_tag: number
            } = {metadata: {}, id: -1, text: -1, date_tag: -1};
        let columnIsMetadata = Array(header.length).fill(true);
        header = header.map((s) => s.toLocaleLowerCase());

        // Process special columns
        for (let columnName of ["id", "text", "date_tag"]) {
            let index = header.indexOf(columnName);
            columnInfo[columnName as "id" | "text" | "date_tag"] = index;

            if (index !== -1) {
                columnIsMetadata[index] = false;
            }
        }
        // Process metadata
        for (let i = 0; i < header.length; i++) {
            if (columnIsMetadata[i]) {
                // Add this column to metadata object
                columnInfo["metadata"][header[i]] = i;
            }
        }
        return columnInfo as LDAColumnInfo;
    }

    /**
     * @summary documents sorted in order of the prevalence
     * of the selected topic
     */
    get sortedDocuments(): SortedLDADocument[] {
        const selectedTopic = this.selectedTopic;
        const sumDocSortSmoothing = LDAModel.DOC_SORT_SMOOTHING * this.numTopics;

        // Return default order if no topic is selected
        if (this.selectedTopic === -1) return this.documents.map(doc => {
            (doc as SortedLDADocument)['score'] = 0;
            return doc as SortedLDADocument
        });

        let sortedDocuments: SortedLDADocument[] = this.documents.map(function (doc, i) {
            (doc as SortedLDADocument)["score"] = (doc.topicCounts[selectedTopic] + LDAModel.DOC_SORT_SMOOTHING) /
                (doc.tokens.length + sumDocSortSmoothing)
            return doc as SortedLDADocument
        });
        sortedDocuments.sort(function (a, b) {
            return b.score - a.score;
        });
        return sortedDocuments;
    }

    get sortedDocumentsSalient(): SortedLDADocument[] {
        if (this.selectedTopic === -1) return this.documents.map(doc => {
            (doc as SortedLDADocument)['score'] = 0;
            return doc as SortedLDADocument
        });

        let sortedDocuments: SortedLDADocument[] = this.documents.map((doc) => {
            (doc as SortedLDADocument)["score"] = this.textSalience(
                doc.originalText,
                this.selectedTopic)
            return doc as SortedLDADocument
        })
        sortedDocuments.sort(function (a, b) {
            return b.score - a.score;
        });
        return sortedDocuments;
    }

    /**
     * @summary returns the number of time the word most assigned to
     * the selected topic was assigned
     */
    get highestWordTopicCount() {
        if (this.selectedTopic === -1) return 0;
        return this.topicWordCounts[this.selectedTopic][0]["count"]
    }

    /**
     * lazy getter for the Date object of the earliest document
     * @note memo stored in this._memoMinDocTime
     */
    get minDocTime(): Date | undefined {
        // If already calculated, return that
        if (this._memoMinDocTime) return this._memoMinDocTime

        // Protect against no documents
        if (!this.documents[0]) {
            console.log("Tried to get minDocTime without any documents")
            return undefined;
        }

        let minTime = this.documents[0].dateObject.getTime()
        // Iterate through docs and keep min found time
        this.documents.forEach((doc) => {
            minTime = Math.min(minTime, doc.dateObject.getTime())
        })
        this._memoMinDocTime = new Date(minTime)
        return this._memoMinDocTime
    }

    /**
     * Lazily loaded Date object for the latest document
     * @note memo stored in this._memoMaxDocTime
     */
    get maxDocTime(): Date | undefined {
        // If already calculated, return that
        if (this._memoMaxDocTime) return this._memoMaxDocTime

        // Protect against no documents
        if (!this.documents[0]) {
            console.log("Tried to get maxDocTime without any documents")
            return undefined;
        }

        let maxTime = this.documents[0].dateObject.getTime()
        // Iterate through docs and keep min found time
        this.documents.forEach((doc) => {
            maxTime = Math.max(maxTime, doc.dateObject.getTime())
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
        let tempFinalBigram: LDABigram = {};
        let tempFinalBigramRev: LDABigram = {};
        for (let word1 in this.bigramCount) {
            tempFinalBigram[word1] = {};
            for (let word2 in this.bigramCount[word1]) {
                let n_oo = this.totalBigramCount;
                let n_ii = this.bigramCount[word1][word2];
                let n_io = this.bigramWord1Count[word1];
                let n_oi = this.bigramWord2Count[word2];

                let score = n_oo * ((n_ii * n_oo - n_io * n_oi) ** 2 /
                    ((n_ii + n_io) * (n_ii + n_oi) * (n_io + n_oo) * (n_oi + n_oo)))

                // check to see if more than 20 occurance in total
                let scoreCheck = score > this.bigramThreshold;
                let freqCheck = n_ii > 20;
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

    /*
     * A function for getting the location of tokens in a string
     * @param {String} text the document object you'd like to parse
     * @returns An iterable set of match Objects with tokens that
     * match LDAModel.tokenRegex. match[0] yields the string matched
     * and match.index yields the location in the text where it matched
     */
    getRawTokensWithIndices(text: string) {
        let tokens = text.toLowerCase().matchAll(this.tokenRegex)
        return tokens
    }

    /**
     *
     * @param {String} text
     * @returns An array of strings in text that match LDAModel.tokenRegex
     */
    getRawTokens(text: string): RegExpMatchArray {
        let match = text.toLowerCase().match(this.tokenRegex)
        if (!match) {
            // @ts-ignore: XRegExp
            console.warn(`Regex ${this.tokenRegex.xregexp.source} did not match anything in: `, text)
            return []
        }
        return match
    }

    /**
     * Get the salience and location of every token in some text
     * @param {String} text the text to parse
     * @param {Number} topic the topic to get saliency for
     * @returns {[{string:String,salience:Number,startIndex:Number}]}
     */
    textToTokenSaliences(text: string, topic: number): { string: string, salience: number, startIndex: number }[] {
        const tokensItter = this.getRawTokensWithIndices(text)
        const tokens = [...tokensItter]
        return tokens.map((token) => {
            return {
                string: token[0],
                salience: this.topicSaliency(token[0], topic),
                startIndex: token.index
            } as { string: string, salience: number, startIndex: number }
        })
    }

    /**
     * A function to get the average token salience in a text
     * @param {String} text text to parse
     * @param {Number} topic topic to get salience of
     * @returns {Number} the average token salience in text for topic
     */
    textSalience(text: string, topic: number): number {
        const tokensSals = this.textToTokenSaliences(text, topic)
        const totalSal = tokensSals.reduce((sumSals, token) => (token.salience + sumSals), 0)
        return totalSal / tokensSals.length
    }

    /**
     * @summary Computes the salience score of a word for a topic
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     * @description This calculation is an adaptation of Chuang et al's 2012
     * work. It is calculated by multiplying the distinctiveness of a word in
     * a given topic, by the probability that any given word in a topic is w.
     */
    topicSaliency(w: string, t: number): number {
        if (this.stopwords[w] === 1) return 0;
        return this.topicDistinctiveness(w, t) * this.pWordGivenTopic(w, t);
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
    topicDistinctiveness(w: string, t: number): number {
        if (this.stopwords[w] === 1) return 0;
        let sigma = 1e-50; // To avoid a log of 0
        return this.pTopicGivenWord(w, t) * Math.log(
            this.pTopicGivenWord(w, t) / this.pTopic(t) + sigma)
    }

    /**
     * @summary the probability of a topic given a word
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     */
    pTopicGivenWord(w: string, t: number): number {
        let smoother = 1;
        if (!this.wordTopicCounts[w]) return 0; // If it isnt a token
        let numWInT = this.wordTopicCounts[w][t];
        if (!numWInT) numWInT = 0;
        let totalWs = Object.keys(this.wordTopicCounts[w]).reduce((sum, key) => sum + this.wordTopicCounts[w][parseInt(key)], 0);

        return (numWInT + smoother) / (totalWs + this.numTopics * smoother);
    }

    /**
     * @summary the probability of a word given a topic
     * @param {String} w Word to analyze
     * @param {Number} t Topic to analyze
     */
    pWordGivenTopic(w: string, t: number): number {
        if (!this.wordTopicCounts[w]) return 0; // If it isnt a token
        let numWInT = this.wordTopicCounts[w][t];
        if (!numWInT) numWInT = 0;
        let numTokensInT = this.tokensPerTopic[t];
        return numWInT / numTokensInT;
    }

    /**
     * @summary The probability of any word being assigned to topic t
     * @param {Number} t Topic to analyze
     */
    pTopic(t: number): number {
        return 1 / this.numTopics;
    }

    /**
     * @summary calculates the highest salience value for all tokens of topic t
     * @param {Number} t Topic to analyze
     * @description Parses at most the most common 1000 tokens in topic t
     * and returns the value of the highest salience.
     */
    _calcMaxTopicSaliency(t: number): number {
        if (t === -1) return 0; // If no topic selected

        // Set to at most 1000
        let endIndex = 1000;
        if (endIndex > this.topicWordCounts[t].length) {
            endIndex = this.topicWordCounts[t].length;
        }
        // Calculate max Saliency
        let maxS = 0;
        for (let i = 0; i < endIndex; i++) {
            let salience = this.topicSaliency(this.topicWordCounts[t][i]["word"], t);
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
    maxTopicSaliency(topicNum: number): number {
        if (this._maxTopicSaliency[topicNum]) return this._maxTopicSaliency[topicNum];
        this._maxTopicSaliency[topicNum] = this._calcMaxTopicSaliency(topicNum);
        return this._maxTopicSaliency[topicNum];
    }

    /**
     * @summary Shifts model to have a dif number of topics
     * @param {Number} numTopics new number of topics
     */
    changeNumTopics(numTopics: number) {
        this.numTopics = numTopics;
        this.selectedTopic = -1;
        this.topicVisibility = this.initTopicVisibility(this.numTopics);
        this.topicWordCounts = [];
        this.tokensPerTopic = zeros(this.numTopics);
        this._topicWeights = zeros(this.numTopics);
        this.wordTopicCounts = {};
        this._maxTopicSaliency = new Array(numTopics);
        this._documentTopicSmoothing = zeros(numTopics).fill(0.1);

        Object.keys(this.vocabularyCounts).forEach((word) => {
            this.wordTopicCounts[word] = {}
        });

        this.documents.forEach((currentDoc, i) => {
            currentDoc.topicCounts = zeros(this.numTopics);
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                let token = currentDoc.tokens[position];
                token.topic = Math.floor(Math.random() * this.numTopics);

                if (!token.isStopword) {
                    this.tokensPerTopic[token.topic]++;
                    if (!this.wordTopicCounts[token.word][token.topic]) {
                        this.wordTopicCounts[token.word][token.topic] = 1;
                    } else {
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
    hyperTune(tune: boolean) {
        if (!this.modelIsRunning)
            this._changeAlpha = tune;
    }

    /**
     * @summary Turns on/off Bigrams option
     */
    _changeBigramStatus(bigramStatus: boolean) {
        if (bigramStatus) {
            this.addBigram();
        } else {
            this.removeBigram();
        }
        this.bigram = bigramStatus;
    }

    /**
     * @summary completes one training iteration
     */
    _sweep() {
        let topicNormalizers = zeros(this.numTopics);
        let doOptimizeAlpha = false;

        if (this._changeAlpha && this.scheduler.totalCompletedSweeps > this._burninPeriod && this._optimizeInterval !== 0 &&
            this.scheduler.totalCompletedSweeps % this._optimizeInterval === 0) {
            doOptimizeAlpha = true;
            this._initializeHistograms()
        }

        for (let topic = 0; topic < this.numTopics; topic++) {
            topicNormalizers[topic] = 1.0 /
                (this._vocabularySize * this._topicWordSmoothing +
                    this.tokensPerTopic[topic]);
        }

        for (let doc = 0; doc < this.documents.length; doc++) {
            let currentDoc = this.documents[doc];
            let docTopicCounts = currentDoc.topicCounts;
            let docLength = 0;
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                let token = currentDoc.tokens[position];
                if (token.isStopword) {
                    continue;
                }
                if (doOptimizeAlpha) {
                    docLength++;
                }

                this.tokensPerTopic[token.topic]--;
                let currentWordTopicCounts = this.wordTopicCounts[token.word];
                currentWordTopicCounts[token.topic]--;
                if (currentWordTopicCounts[token.topic] === 0) {
                }
                docTopicCounts[token.topic]--;
                topicNormalizers[token.topic] = 1.0 /
                    (this._vocabularySize * this._topicWordSmoothing +
                        this.tokensPerTopic[token.topic]);

                let sum = 0.0;
                for (let topic = 0; topic < this.numTopics; topic++) {
                    if (currentWordTopicCounts[topic]) {
                        this._topicWeights[topic] =
                            (this._documentTopicSmoothing[topic] + docTopicCounts[topic]) *
                            (this._topicWordSmoothing + currentWordTopicCounts[topic]) *
                            topicNormalizers[topic];
                    } else {
                        this._topicWeights[topic] =
                            (this._documentTopicSmoothing[topic] + docTopicCounts[topic]) *
                            this._topicWordSmoothing *
                            topicNormalizers[topic];
                    }
                    sum += this._topicWeights[topic];

                }

                // Sample from an unnormalized discrete distribution
                let sample = sum * Math.random();
                let i = 0;
                sample -= this._topicWeights[i];
                while (sample > 0.0) {
                    i++;
                    sample -= this._topicWeights[i];
                }
                token.topic = i;

                this.tokensPerTopic[token.topic]++;

                if (!currentWordTopicCounts[token.topic]) {
                    currentWordTopicCounts[token.topic] = 1;
                } else {
                    currentWordTopicCounts[token.topic] += 1;
                }
                docTopicCounts[token.topic]++;

                topicNormalizers[token.topic] = 1.0 /
                    (this._vocabularySize * this._topicWordSmoothing +
                        this.tokensPerTopic[token.topic]);

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
    }

    get iterations() {
        return this.scheduler.totalCompletedSweeps;
    }

    /**
     *  Gather statistics on the size of documents
     *  and create histograms for use in Dirichlet hyperparameter
     *  optimization.
     */
    _initializeHistograms = () => {
        let maxTokens = 0;
        // let totalTokens = 0;
        let seqLen;

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

        // @ts-ignore this array is being initialized
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
     * @param {Number} shape Gamma prior E(X) = shape * scale, let(X) = shape * scale<sup>2</sup>
     * @param {Number} scale
     * @param {Number} numIterations 200 to 1000 generally insures convergence, but 1-5 is often enough to step in the right direction
     * @returns The sum of the learned parameters.
     */
    _learnParameters = (parameters: number[],
                        observations: number[][],
                        observationLengths: number[],
                        shape: number,
                        scale: number,
                        numIterations: number) => {

        let i;
        let k;
        let parametersSum = 0;

        // Initialize the parameter sum
        for (k = 0; k < parameters.length; k++) {
            parametersSum += parameters[k];
        }

        let oldParametersK;
        let currentDigamma;
        let denominator;

        let nonZeroLimit;
        let nonZeroLimits = zeros(observations.length).fill(-1);

        // The histogram arrays go up to the size of the largest document,
        //	but the non-zero values will almost always cluster in the low end.
        //	We avoid looping over empty arrays by saving the index of the largest
        //	non-zero value.

        let histogram;

        for (i = 0; i < observations.length; i++) {
            histogram = observations[i];

            for (k = 0; k < histogram.length; k++) {
                if (histogram[k] > 0) {
                    nonZeroLimits[i] = k;
                }
            }
        }

        for (let iteration = 0; iteration < numIterations; iteration++) {

            // Calculate the denominator
            denominator = 0;
            currentDigamma = 0;

            // Iterate over the histogram:
            for (i = 1; i < observationLengths.length; i++) {
                currentDigamma += 1 / (parametersSum + i - 1);
                denominator += observationLengths[i] * currentDigamma;
            }

            // Bayesian estimation Part I
            denominator -= 1 / scale;

            // Calculate the individual parameters

            parametersSum = 0;

            for (k = 0; k < parameters.length; k++) {

                // What's the largest non-zero element in the histogram?
                nonZeroLimit = nonZeroLimits[k];

                oldParametersK = parameters[k];
                parameters[k] = 0;
                currentDigamma = 0;

                histogram = observations[k];

                for (i = 1; i <= nonZeroLimit; i++) {
                    currentDigamma += 1 / (oldParametersK + i - 1);
                    parameters[k] += histogram[i] * currentDigamma;
                }

                // Bayesian estimation part II
                parameters[k] = oldParametersK * (parameters[k] + shape) / denominator;

                parametersSum += parameters[k];
            }
        }

        if (parametersSum < 0.0) {
            throw Error("sum: " + parametersSum);
        }
        return parametersSum;
    }

    /**
     * @summary adds a word to model's stoplist
     * if the bigram option is on, we add bigrams that contain the stopword as well.
     * @param {String} word the word to be added to stoplist
     * @param {Boolean} refresh whether or not to run sortTopicWords
     */
    addStop(word: string, refresh = false) {
        displayMessage(`adding "${word}" to stoplist`, 0, () => {
            this.addStopHelper(word);
            if (this.bigram) {
                for (let w in this.finalBigram[word]) {
                    this.addStopHelper(word + "_" + w)
                }
                for (let w in this.finalBigramRev[word]) {
                    this.addStopHelper(w + "_" + word)
                }
            }
            if (refresh) {
                this.sortTopicWords()
            }
            displayMessage(`"${word}" added to stoplist`, 4000)
            this.updateWebpage()
        })
    }

    /**
     * @summary adds a word to model's stoplist
     * @param {String} word the word to be added to stoplist
     */
    addStopHelper(word: string) {
        if (!this.stopwords[word]) {
            this.stopwords[word] = 1;
            this._vocabularySize--;
            delete this.wordTopicCounts[word];

            this.documents.forEach((currentDoc, i) => {
                let docTopicCounts = currentDoc.topicCounts;
                for (let position = 0; position < currentDoc.tokens.length; position++) {
                    let token = currentDoc.tokens[position];
                    if (token.word === word) {
                        token.isStopword = true;
                        this.tokensPerTopic[token.topic]--;
                        docTopicCounts[token.topic]--;
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
    removeStop(word: string) {
        displayMessage(`removing "${word}" from stoplist`, 0, () => {
            this.removeStopHelper(word);
            if (this.bigram) {
                for (let w in this.finalBigram[word]) {
                    if (this.stopwords[word + "_" + w] && !this.stopwords[w]) {
                        this.removeStopHelper(word + "_" + w)
                    }
                }
                for (let w in this.finalBigramRev[word]) {
                    if (this.stopwords[w + "_" + word] && !this.stopwords[w]) {
                        this.removeStopHelper(w + "_" + word)
                    }
                }
            }
            displayMessage(`"${word}" removed from stoplist`, 4000)
            this.updateWebpage()
        })
    }

    /**
     * @summary removes a word from stoplist
     * @param {String} word the word to remove
     */
    removeStopHelper(word: string) {
        delete this.stopwords[word];
        this._vocabularySize++;
        this.wordTopicCounts[word] = {};
        let currentWordTopicCounts = this.wordTopicCounts[word];

        this.documents.forEach((currentDoc, i) => {
            let docTopicCounts = currentDoc.topicCounts;
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                let token = currentDoc.tokens[position];
                if (token.word === word) {
                    token.isStopword = false;
                    this.tokensPerTopic[token.topic]++;
                    docTopicCounts[token.topic]++;
                    if (!currentWordTopicCounts[token.topic]) {
                        currentWordTopicCounts[token.topic] = 1;
                    } else {
                        currentWordTopicCounts[token.topic] += 1;
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
    addBigram() {
        for (let word1 in this.finalBigram) {
            if (!this.stopwords[word1]) {
                for (let word2 in this.finalBigram[word1]) {
                    if (!this.stopwords[word2]) {
                        this.addBigramHelper(word1, word2);
                    }
                }
            }
        }
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
     * @param {String} word2 second word of the bigram to add
     */
    addBigramHelper(word1: string, word2: string) {
        // Makes word1_word2 into a “word” by adding it to the wordTopicCounts, vocaburaryCounts,
        // and increasing the vocaburarySize.
        let curBigram = word1 + "_" + word2
        this.wordTopicCounts[curBigram] = {};
        this.vocabularyCounts[curBigram] = 0;
        let currentWordTopicCounts = this.wordTopicCounts[curBigram];
        this._vocabularySize++;

        this.documents.forEach((currentDoc, i) => {
            let docTopicCounts = currentDoc.topicCounts;
            let skipNext = false;
            let tempTokens: LDAToken[] = [];
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                if (skipNext) {
                    skipNext = false;
                } else {
                    let token = currentDoc.tokens[position];
                    if (position === currentDoc.tokens.length - 1) {
                        tempTokens.push(token)
                    } else {
                        let nextToken = currentDoc.tokens[position + 1];
                        // We look for all occurrences of word1 followed directly by word2 in this.documents
                        // Then, we replace the two tokens for word1 and word2 by one token for
                        // word1_word2 in this.documents
                        // For every bigram occurrence, we subtract the vocaburaryCounts of word 1
                        // and word2 and add to the vocaburaryCounts of the bigram
                        if (token.word === word1 && nextToken.word === word2) {
                            let random_boolean = Math.random() < 0.5;
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
                                currentWordTopicCounts[token.topic] += 1;
                                token.word = curBigram;
                                tempTokens.push(token);
                            } else {
                                this.tokensPerTopic[token.topic]--;
                                docTopicCounts[token.topic]--;
                                if (!currentWordTopicCounts[nextToken.topic]) {
                                    currentWordTopicCounts[nextToken.topic] = 0;
                                }
                                currentWordTopicCounts[nextToken.topic] += 1;
                                nextToken.word = curBigram;
                                tempTokens.push(nextToken);
                            }
                            skipNext = true;
                        } else {
                            tempTokens.push(token)
                        }
                    }
                }
            }
            currentDoc.tokens = tempTokens;
        })
    }

    /**
     * @summary Remove bigrams from the model
     * Calls helper removeBigramHelper on each bigram deemed valid in finalBigram.
     */
    removeBigram() {
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
    removeBigramHelper(word1: string, word2: string) {
        let curBigram = word1 + "_" + word2
        delete this.wordTopicCounts[curBigram];
        delete this.vocabularyCounts[curBigram];
        let firstAppearance = true;

        this.documents.forEach((currentDoc, i) => {
            let docTopicCounts = currentDoc.topicCounts;
            let tempTokens: LDAToken[] = [];
            for (let position = 0; position < currentDoc.tokens.length; position++) {
                let token = currentDoc.tokens[position];
                if (token.word === curBigram) {
                    if (firstAppearance) {
                        this._vocabularySize--;
                        firstAppearance = false;
                    }
                    if (!this.stopwords[word1]) {
                        this.wordTopicCounts[word1][token.topic]++;
                        // TODO: fix this

                        // this.docTopicCounts--;
                    }
                    if (!this.stopwords[word2]) {
                        this.wordTopicCounts[word2][token.topic]++;
                        // this.docTopicCounts--;
                    }
                    this.vocabularyCounts[word1]++;
                    this.vocabularyCounts[word2]++;
                    docTopicCounts[token.topic]++;
                    token.word = word1;
                    token.isStopword = Boolean(this.stopwords[word1]);
                    tempTokens.push(token);
                    let isStopword = this.stopwords[word2];
                    tempTokens.push({"word": word2, "topic": token.topic, "isStopword": Boolean(isStopword)});
                } else {
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
    getTopicCorrelations() {
        // initialize the matrix
        let correlationMatrix: number[][] = new Array(this.numTopics);
        for (let t1 = 0; t1 < this.numTopics; t1++) {
            correlationMatrix[t1] = zeros(this.numTopics);
        }

        let topicProbabilities = zeros(this.numTopics);

        // iterate once to get mean log topic proportions
        this.documents.forEach((d, i) => {

            // We want to find the subset of topics that occur with non-trivial concentration in this document.
            // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
            let documentTopics: number[] = [];
            let tokenCutoff = Math.max(this._correlationMinTokens,
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
    addSweepRequest(numRequests: number) {
        this.scheduler.sweep(numRequests)
    }

    /**
     * @summary Stops the model from continuing it's sweeps
     */
    stopSweeps() {
        this.scheduler.stop()
    }

    /**
     * @summary a list of the metadata fields in the model
     */
    get metaFields(): string[] {
        if (!this.documents[0]) {
            throw(Error("No documents in model"));
        }

        let fields: string[] = []
        for (const [key,] of Object.entries(this.documents[0].metadata)) {
            fields.push(key)
        }

        return fields
    }

    /**
     * @summary Returns all values in a metadata field
     * @param {String} field
     * @returns {Array} Values in field
     */
    metaValues(field: string): string[] {
        if (!this.metaFields.includes(field)) {
            console.log("Given metadata field is not in model");
        }

        // Reduce to unique values
        return this.documents.reduce((values: string[], doc: LDADocument) => {
            if (!values.includes(doc.metadata[field])) {
                values.push(doc.metadata[field])
            }
            return values
        }, [])
    }

    /**
     * @summary Calculates the average topic value for every value
     * in a metadata field
     * @param {String} field metadata field to get summary of
     * @param {*} topic topic number to get summary of
     */
    metaTopicAverages(field: string, topic: number) {
        if (!this.metaFields.includes(field)) {
            throw(Error("Given metadata field is not in model"))
        }

        const metaValues = this.metaValues(field)
        let averages: { [key: string]: number } = {}
        for (let value of metaValues) {
            averages[value] = this.averageTopicValInCategory(field, value, topic)
        }
        return averages;
    }

    /**
     * @summary Calculates the average value of a topic in a metadata category
     * @param {String} field The metavalue field category is in
     * @param {String} category The category to get average of
     * @param {Number} topic The number of the topic to get average of
     */
    averageTopicValInCategory(field: string, category: string, topic: number): number {
        // Reduce to scores of documents with this metadata value
        let topicScores = this.documents.reduce((scores: number[], doc: LDADocument) => {
            // If in category add topic average
            if (doc.metadata[field] === category) {
                scores.push(doc.topicCounts[topic] / doc.tokens.length)
            }
            return scores
        }, []);

        // Return the average
        return topicScores.reduce((a, b) => a + b, 0) / topicScores.length
    }

    /**
     * @summary The average topic values in a metadata category
     * @param {String} field Metadata field to category is in
     * @param {String} category Metadata category to analyze
     * @returns {Array<Number>} Average topic vals with index matching topic num
     */
    topicAvgsForCatagory(field: string, category: string): number[] {
        let averages: number[] = []
        for (let topic = 0; topic < this.numTopics; topic++) {
            averages.push(this.averageTopicValInCategory(field, category, topic))
        }
        return averages;
    }

    /**
     * @summary The topic and metadata[field] values for every document
     * @param {String} field Meta field to pull values of
     * @param {Number} topic Topic to pull values from
     * @returns {Array<{topicVal:Number,label:String,metaVal:any}>}
     */
    docTopicMetaValues(field: string, topic: number): { topicVal: number, label: string | number, metaVal: string }[] {
        return this.documents.map((doc) => {
            return {
                topicVal: doc.topicCounts[topic] / doc.tokens.length,
                label: doc.id,
                metaVal: doc.metadata[field]
            }
        })
    }

    /**
     * @summary Calculates average topic value over numberToAvg closest
     * documents and then combines documents with the same time value
     * @param {Number} topic number of topic
     * @param {Number} numberToAvg number of documents to average over
     * @returns {Array<{key:Date,value:Number}>} rolling average topic
     * value over time
     */
    topicTimeRollingAvg(topic: number, numberToAvg: number): { key: Date, value: number }[] {
        numberToAvg = Math.max(numberToAvg, 1);

        // Sort documents by time
        let documents = this.documents.sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime())

        // Calculate rolling average
        let averaged = documents.map((doc, i) => {
            // Control for out of bounds
            let startIndex = Math.max(0, Math.round(i - numberToAvg / 2));
            let endIndex = Math.min(documents.length, Math.round(i + numberToAvg / 2));
            // Gather values
            let vals: number[] = [];
            for (let j = startIndex; j < endIndex; j++) {
                vals.push(documents[j].topicCounts[topic] /
                    documents[j].tokens.length);
            }
            return {
                rollingAvg: vals.reduce((a, b) => a + b) / vals.length,
                date: doc.dateObject,
            }
        })

        // Combine documents with the same time stamp
        let topicMeans = d3
            // @ts-ignore this function clearly exists
            .nest()
            .key(function (d: { date: Date }) {
                return d.date;
            })
            .rollup(function (d: typeof averaged) {
                return d3.mean<{ rollingAvg: number }>(d, x => x.rollingAvg);
            })
            .entries(averaged);

        // Turn key back into Date object
        return topicMeans.map((d: { key: number, value: number }) => {
            return {key: new Date(d.key), value: d.value}
        })
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
    topicTimesBinnedAverage(topic: number, numBins: number, stdError = false): LDATopicTimeBinAveraged[] {
        let bins: LDATopicTimeBin[] = this.topicTimesBinned(topic, numBins);

        // replace any NaN values with 0
        bins.forEach(bin => {
            for (let j = 0; j < bin.value.length; j++) {
                if (isNaN(bin.value[j])) {
                    bin.value[j] = 0;
                }
            }
        });

        if (stdError) {
            bins = this.addStdErrorMargins(bins)
        }

        // Calc average for every bin
        return bins.map(bin => {
            const total = bin.value.reduce((a, b) => a + b, 0);
            return {
                ...bin,
                value: total / bin.value.length,
            }
        })
    }

    /**
     * Function to add standard error margins to collections of values
     * @param {Array<{value:Array<Number}>} valArray array of dictionaries to
     * add stdError margins to. Must have value element.
     * @returns {Array<{value:Array<Number},upperEr:Number,lowerEr:Number>}
     * where upperEr/lowerEr are the margins of error of value at the 90%
     * confidence level.
     */
    addStdErrorMargins(valArray: LDATopicTimeBin[]): LDATopicTimeBinWithStd[] {
        return valArray.map((dict) => {
            const n = dict.value.length
            const mean = dict.value.reduce((a, b) => a + b) / n
            const stdDev = Math.sqrt(dict.value.map(
                x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
            const stdError = stdDev / Math.sqrt(n)
            const z = 1.645
            let newDict = {...dict} as LDATopicTimeBinWithStd
            newDict.upperEr = mean + z * stdError
            newDict.lowerEr = Math.max(mean - z * stdError, 0)
            return newDict
        })
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
    topicTimesBinned(topic: number, numBins: number): LDATopicTimeBin[] {
        numBins = Math.max(numBins, 1);

        if (this.maxDocTime === undefined || this.minDocTime === undefined) {
            throw Error("Time not yet calculated");
        }

        // Make bins
        let timeSpan = this.maxDocTime.getTime() - this.minDocTime.getTime();
        let binSize = Math.ceil(timeSpan / numBins); // ceil to make sure all docs have a bin

        let bins: LDATopicTimeBin[] = []
        for (let binNum = 0; binNum < numBins; binNum++) {
            bins.push({
                key: new Date(this.minDocTime.getTime() + binSize * (binNum + 1)),
                value: []
            })
        }

        // Group topic values into bins
        let documents = this.documents.sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime())
        let currentBin = 0; // Keep track of which bin section of doc array we're in
        documents.forEach((doc) => {
            if (bins[currentBin].key < doc.dateObject) currentBin++;

            // Record average topic value for doc
            bins[currentBin].value.push(doc.topicCounts[topic] /
                doc.tokens.length)
        })

        return bins
    }
}

/**
 * a helper function for formatting ETA
 * @param s - number of seconds
 */
function formatTime(s: number): string {
    let seconds = s % 60;
    let minutes = Math.floor(s / 60) % 60;
    let hours = Math.floor(s / 3600);

    let formatted: string;
    if (hours === 0)
        formatted = seconds.toFixed(minutes > 0 ? 0 : 2) + "s"
    else // for things that will take hours we don't care about seconds
        formatted = ""
    if (minutes > 0 || hours > 0)
        formatted = `${minutes}m${formatted}`
    if (hours > 0)
        formatted = `${hours}h${formatted}`
    return formatted
}

/**
 * A utility class for calculating rolling average
 * @constructor
 * @param entries - number of entries to keep in the rolling average queue
 */
class RollingAvg {
    private arr: number[]
    readonly entries: number

    constructor(entries: number) {
        this.arr = [0]
        // initialize to a single 0 to avoid some strange errors related to empty arrays
        this.entries = entries
    }

    /**
     * Add a number to the rolling average queue
     * @param n - the number to add
     */
    add(n: number) {
        this.arr.push(n)
        if (this.arr.length > this.entries)
            this.arr.shift()
    }

    /**
     * reset the array to initial value
     */
    reset() {
        this.arr = [0]
    }

    /**
     * get the current rolling average
     */
    avg(): number {
        return this.arr.reduce((a, b) => a + b) / this.arr.length
    }
}

/**
 * a helper class for scheduling sweeps based on UI and posting update status messages.
 * it also updates the display for current number of iterations through raw HTML selectors.
 */
class SweepScheduler {
    totalCompletedSweeps: number;
    completedSweeps: number; // this is only for displaying on top, not checked in code
    shouldStop: boolean;
    remainingSweeps: number
    model: LDAModel
    timeTaken: RollingAvg

    constructor(model: LDAModel) {
        this.totalCompletedSweeps = 0;
        this.shouldStop = false;
        this.remainingSweeps = 0;
        this.completedSweeps = 0;
        this.model = model;
        this.timeTaken = new RollingAvg(50);
    }

    /**
     * performs number of sweeps as requested, or until the user has hit the stop button
     * @param n - the number of sweeps to schedule
     */

    sweep(n: number) {
        this.remainingSweeps += n;
        this.model.modelIsRunning = true;
        // this is necessary because the stop button relies on modelIsRunning, which is not a
        // react state and a forced render is needed. there is probably no point in
        // re-rendering the entire page (only TopBar needs to be re-rendered), but
        // this function call here is very infrequent so it should be fine
        // (here, not sure about the performance impact in other places)
        this.model.updateWebpage();
        let start = new Date().getTime()
        this.sweepLoop().then(
            _ => {
                displayMessage(`Completed ${this.completedSweeps} iteration${this.completedSweeps > 1 ? "s" : ""
                } in ${formatTime((new Date().getTime() - start) / 1000)}`, 2500);
                this.remainingSweeps = 0;
                this.completedSweeps = 0;
                this.timeTaken.reset();
                this.shouldStop = false;

                this.model.modelIsRunning = false
                this.model.sortTopicWords(); // this function calls updateWebpage()

                // copied from previous code, unsure what it does
                this.model._maxTopicSaliency = new Array(this.model.numTopics);
            }
        )
    }

    private async sweepLoop() {
        while (!this.shouldStop && this.remainingSweeps > 0) {
            let timeStarted = new Date().getTime(); // include the messaging time for better accuracy
            await displayMessage(`Progress: ${
                (this.completedSweeps / (this.completedSweeps + this.remainingSweeps) * 100).toFixed(2)
            }% ETA: ${
                formatTime(this.timeTaken.avg() * this.remainingSweeps / 1000)
            }`, 0, "promise")
            this.model._sweep()
            this.remainingSweeps--;
            this.completedSweeps++;
            this.totalCompletedSweeps++;
            document.getElementById("iters")!.innerText = this.totalCompletedSweeps.toString()
            this.timeTaken.add(new Date().getTime() - timeStarted);
        }
    }

    /**
     * stop the running loop. note that it's possible for this function to be called in the middle of a sweep
     * (more precisely, right after the status message update but before the actual sweep computation), in which case the
     * current sweep will not be interrupted.
     */
    stop() {
        if (this.remainingSweeps > 0) {
            // we want to set this flag only in the case of interruption
            this.shouldStop = true;
        }
    }

    /**
     * reset the scheduler to initial state
     */
    reset() {
        this.totalCompletedSweeps = 0;
        this.shouldStop = false;
        this.remainingSweeps = 0;
        this.completedSweeps = 0;
        this.timeTaken.reset();
        document.getElementById("iters")!.innerText = "0";
    }


}
