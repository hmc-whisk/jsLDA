import React, { Component } from 'react'; 
import * as d3 from 'd3';

class VocabTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
      }
    
    specificityScale = d3.scaleLinear().domain([0,1]).range(["#ffffff", "#99d8c9"]);


      // used by toggleTopicDocuments in topicdocuments, ready, changeNumTopics in processing, sweep in sweep
    vocabTable() {
      var format = d3.format(".2g");
      var wordFrequencies = this.mostFrequentWords(this.props.displayingStopwords, this.props.sortVocabByTopic).slice(0, 499);
      var table = d3.select("#vocab-table tbody");
      table.selectAll("tr").remove();
      
      let stopwords = this.props.stopwords;
      let specificity = this.specificity;
      let specificityScale = this.specificityScale;
      let addStop = this.props.addStop;
      let removeStop = this.props.removeStop;

      wordFrequencies.forEach(function (d) {
        var isStopword = stopwords[d.word];
        var score = specificity(d.word);
        var row = table.append("tr");
        row.append("td").text(d.word).style("color", isStopword ? "#444444" : "#000000");
        row.append("td").text(d.count);
        row.append("td").text(isStopword ? "NA" : format(score))
        .style("background-color", specificityScale(score));
        row.append("td").append("button").text(stopwords[d.word] ? "unstop" : "stop")
        .on("click", function () {
          console.log(d.word);
          if (! isStopword) { addStop(d.word); }
          else { removeStop(d.word); }
        });
      });
    }
  
    mostFrequentWords(includeStops, sortByTopic) {
      // Convert the random-access map to a list of word:count pairs that
      //  we can then sort.
      var wordCounts = [];
    
      if (sortByTopic) {
        for (var word in this.props.vocabularyCounts) {
          if (this.props.wordTopicCounts[word] &&
            this.props.wordTopicCounts[word][this.props.selectedTopic]) {
            wordCounts.push({"word":word,
                     "count":this.props.wordTopicCounts[word][this.props.selectedTopic]});
          }
        }
      }
      else {
        for (var word in this.props.vocabularyCounts) {
          if (includeStops || ! this.props.stopwords[word]) {
            wordCounts.push({"word":word,
                     "count":this.props.vocabularyCounts[word]});
          }
        }
      }
    
      wordCounts.sort(this.props.byCountDescending);
      return wordCounts;
    }
  
    specificity = (word)=> {
      return 1.0 - (this.entropy(d3.values(this.props.wordTopicCounts[word])) / Math.log(this.props.numTopics));
    }
  
    entropy(counts) {
      counts = counts.filter(function (x) { return x > 0.0; });
      var sum = d3.sum(counts);
      return Math.log(sum) - (1.0 / sum) * d3.sum(counts, function (x) { return x * Math.log(x); });
    }
  
    componentDidMount() {
    }

    componentDidUpdate(prevProps) {
        this.vocabTable();
    }

    render() {
        return (
            <div id="vocab-page" className="page">
                <div className="help">Words occurring in only one topic have specificity 1.0, words evenly distributed among all topics have specificity 0.0. <button id="showStops">Show stopwords</button>
                    <button id="sortVocabByTopic">Sort by topic</button>
                </div>
                <table id="vocab-table">
                    <thead><tr><th>Word</th><th>Frequency</th><th>Topic Specificity</th><th>Stoplist</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        )
    }
}

export default VocabTable



d3.select("#showStops").on("click", function () {
    if (this.props.displayingStopwords) {
      this.props.displayingStopwords = false;
      this.innerText = "Show stopwords";
    //   vocabTable();
    }
    else {
      this.props.displayingStopwords = true;
      this.innerText = "Hide stopwords";
    //   vocabTable();
    }
  });
  
  d3.select("#sortVocabByTopic").on("click", function () {
    if (this.props.sortVocabByTopic) {
      this.props.sortVocabByTopic = false;
      this.innerText = "Sort by topic";
    //   vocabTable();
    }
    else {
      this.props.sortVocabByTopic = true;
      this.innerText = "Sort by frequency";
    //   vocabTable();
    }
  });
  