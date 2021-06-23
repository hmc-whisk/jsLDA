import React, {ChangeEvent, Component} from 'react';
import * as d3 from 'd3';
import './pages.css';
import type {LDAModelDataDLer} from "core";

interface VocabTableProps {
    sortVocabByTopic: boolean,
    sortByTopicChange: (sort: boolean) => void,
    vocabularyCounts: { [key: string]: number },
    wordTopicCounts: { [key: string]: { [key: string]: number } },
    selectedTopic: number,
    stopwords: { [key: string]: 1 | undefined },
    numTopics: number,
    byCountDescending: (a: { count: number }, b: { count: number }) => number,
    addStop: (word: string, refresh?: boolean) => void,
    removeStop: (word: string) => void,
    update: boolean,
    modelIsRunning: boolean,
    modelDataDLer: LDAModelDataDLer
}

interface VocabTableState {
    displayingStopwords: boolean,
    searchText: string
}

export class VocabTable extends Component<VocabTableProps, VocabTableState> {
    constructor(props:VocabTableProps) {
        super(props);
        this.state = {
            displayingStopwords: false,
            searchText: "",
        };
    }


    specificityScale = d3.scaleLinear<string>().domain([0, 1]).range([
        getComputedStyle(document.documentElement).getPropertyValue('--color3'),
        getComputedStyle(document.documentElement).getPropertyValue('--color2')]);


    // used by toggleTopicDocuments in topicdocuments, ready, changeNumTopics in processing, sweep in sweep
    createVocabTable() {
        let format = d3.format(".2g");
        let wordFrequencies = this.mostFrequentWords(this.state.displayingStopwords, this.props.sortVocabByTopic).slice(0, 499);
        let table = d3.select("#vocab-table tbody");
        table.selectAll("tr").remove();

        let stopwords = this.props.stopwords;
        let specificityScale = this.specificityScale;
        let addStop = this.props.addStop;
        let removeStop = this.props.removeStop;

        // TL: SEARCH
        if (this.state.searchText !== "") {
            wordFrequencies = wordFrequencies.filter(d => d.word.includes(this.state.searchText));
        }
        let shouldDisable = this.props.modelIsRunning? "true" : null
        wordFrequencies.forEach((d) => {
            let isStopword = stopwords[d.word];
            let score = this.specificity(d.word);

            let row = table.append("tr");
            row.append("td").text(d.word).style("color", isStopword ? "#444444" : "#000000");
            row.append("td").text(d.count);
            row.append("td").text(isStopword ? "NA" : format(score))
                .style("background-color", specificityScale(score));
            row.append("td").append("button").text(stopwords[d.word] ? "unstop" : "stop")
                .attr("class", "lightButton")
                .on("click", function () {
                    console.log(d.word);
                    if (!isStopword) {
                        addStop(d.word, true);
                    } else {
                        removeStop(d.word);
                    }
                })
                // @ts-ignore: TS2769. There's an open issue with typescript overload resolution
                // see https://github.com/microsoft/TypeScript/issues/14107
                .attr("disabled", shouldDisable)
        });
    }

    mostFrequentWords(includeStops: boolean, sortByTopic: boolean) {
        // Convert the random-access map to a list of word:count pairs that
        //  we can then sort.
        let wordCounts: { word: string, count: number }[] = [];

        if (sortByTopic) {
            for (let word in this.props.vocabularyCounts) {
                if (this.props.wordTopicCounts[word] &&
                    this.props.wordTopicCounts[word][this.props.selectedTopic]) {
                    wordCounts.push({
                        word,
                        "count": this.props.wordTopicCounts[word][this.props.selectedTopic]
                    });
                }
            }
        } else {
            for (let word in this.props.vocabularyCounts) {
                if (includeStops || !this.props.stopwords[word]) {
                    wordCounts.push({
                        "word": word,
                        "count": this.props.vocabularyCounts[word]
                    });
                }
            }
        }

        wordCounts.sort(this.props.byCountDescending);
        return wordCounts;
    }

    specificity(word: string): number {
        // @ts-ignore TS2339: d3.values does exist
        return 1.0 - (this.entropy(d3.values(this.props.wordTopicCounts[word])) / Math.log(this.props.numTopics));
    }

    entropy(counts: number[]) {
        counts = counts.filter(function (x) {
            return x > 0.0;
        });
        let sum = d3.sum(counts);
        return Math.log(sum) - (1.0 / sum) * d3.sum(counts, function (x) {
            return x * Math.log(x);
        });
    }

    setDisplay(displayingStopwords: boolean) {
        this.setState({displayingStopwords: displayingStopwords})
    }

    setUp() {
        let displayingStopwords = this.state.displayingStopwords;
        let sortVocabByTopic = this.props.sortVocabByTopic;
        let setDisplay = this.setDisplay.bind(this);
        let setSort = this.props.sortByTopicChange;
        let selectedTopic = this.props.selectedTopic;

        d3.select<HTMLButtonElement, never>("#showStops").on("click", function () {
            if (displayingStopwords) {
                this.innerText = "Show stopwords";
                setDisplay(false);
                //   vocabTable();
            } else {
                this.innerText = "Hide stopwords";
                setDisplay(true);
                //   vocabTable();
            }
        });

        d3.select<HTMLButtonElement, never>("#sortVocabByTopic").on("click", function () {
            console.log(selectedTopic);
            if (selectedTopic === -1) {
                alert("Please first select a topic from the left.")
            } else {
                if (sortVocabByTopic) {
                    this.innerText = "Sort by topic";
                    setSort(false);
                    //   vocabTable();
                } else {
                    this.innerText = "Sort by frequency";
                    setSort(true);
                    //   vocabTable();
                }
            }
        });

    }

    handleChange(e: ChangeEvent<HTMLInputElement>) {
        this.setState({searchText: e.target.value})
    }

    componentDidMount() {
        this.createVocabTable();
        this.setUp();
    }

    componentDidUpdate() {
        this.createVocabTable();
        this.setUp();
    }

    shouldComponentUpdate(nextProps: VocabTableProps) {
        return nextProps.update;
    }

    render() {
        return (
            <div
                id="vocab-page"
                style={{
                    flex: "1",
                    display: "flex",
                    marginTop: "20px",
                    overflow: "hidden",
                }}
                className="page">
                <div style={{
                    flex: "1",
                    marginTop: "10px",
                    height: "100%",
                    overflowX: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    width: "90%",
                    padding: "10px 10px 10px 10px"
                }}>
                    <input
                        type="text"
                        placeholder="Search Vocab"
                        onChange={this.handleChange.bind(this)}
                        style={{
                            height: "30px",
                            width: "320px",
                            borderRadius: "10px",
                            border: "1px let(--color1) solid",
                            outline: "none",
                        }}
                    />
                    <div style={{flex: "1", overflow: "auto"}}>
                        <table id="vocab-table">
                            <thead>
                            <tr>
                                <th>Word</th>
                                <th>Frequency</th>
                                <th>Topic Specificity</th>
                                <th>Stoplist</th>
                            </tr>
                            </thead>
                            <tbody/>
                        </table>
                    </div>
                </div>

                <div style={{display: "flex", flexDirection: "column", flex: "1"}}>
                    <div className="help">
                        Words occurring in only one topic have specificity 1.0, words evenly distributed among all
                        topics have specificity 0.0.
                    </div>
                    <div className="help" style={{display: "flex", flexDirection: "column", flex: "1"}}>
                        <button id="showStops" className="lightButton" style={{marginTop: "15px"}}>Show stopwords
                        </button>
                        <button id="sortVocabByTopic" className="lightButton" style={{marginTop: "15px"}}>Sort by
                            topic
                        </button>
                        {this.stopwordsDLButton}
                    </div>
                </div>
            </div>
        )
    }

    get stopwordsDLButton() {
        return (
            <>
                <button id="stopword-dl" className="lightButton" style={{marginTop: "15px"}}
                        onClick={this.props.modelDataDLer.downloadStopwords.bind(this.props.modelDataDLer)}>
                    Download stopwords
                </button>
            </>
        )
    }
}

export default VocabTable
