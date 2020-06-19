d3.select("#showStops").on("click", function () {
  if (displayingStopwords) {
    displayingStopwords = false;
    this.innerText = "Show stopwords";
    vocabTable();
  }
  else {
    displayingStopwords = true;
    this.innerText = "Hide stopwords";
    vocabTable();
  }
});

d3.select("#sortVocabByTopic").on("click", function () {
  if (sortVocabByTopic) {
    sortVocabByTopic = false;
    this.innerText = "Sort by topic";
    vocabTable();
  }
  else {
    sortVocabByTopic = true;
    this.innerText = "Sort by frequency";
    vocabTable();
  }
});

// used by toggleTopicDocuments in topicdocuments, ready, changeNumTopics in processing, sweep in sweep
function vocabTable() {
    var format = d3.format(".2g");
    var wordFrequencies = mostFrequentWords(displayingStopwords, sortVocabByTopic).slice(0, 499);
    var table = d3.select("#vocab-table tbody");
    table.selectAll("tr").remove();
  
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

function mostFrequentWords(includeStops, sortByTopic) {
    // Convert the random-access map to a list of word:count pairs that
    //  we can then sort.
    var wordCounts = [];
  
    if (sortByTopic) {
      for (var word in vocabularyCounts) {
        if (wordTopicCounts[word] &&
          wordTopicCounts[word][selectedTopic]) {
          wordCounts.push({"word":word,
                   "count":wordTopicCounts[word][selectedTopic]});
        }
      }
    }
    else {
      for (var word in vocabularyCounts) {
        if (includeStops || ! stopwords[word]) {
          wordCounts.push({"word":word,
                   "count":vocabularyCounts[word]});
        }
      }
    }
  
    wordCounts.sort(byCountDescending);
    return wordCounts;
  }

function specificity(word) {
    return 1.0 - (entropy(d3.values(wordTopicCounts[word])) / Math.log(numTopics));
  }

function entropy(counts) {
    counts = counts.filter(function (x) { return x > 0.0; });
    var sum = d3.sum(counts);
    return Math.log(sum) - (1.0 / sum) * d3.sum(counts, function (x) { return x * Math.log(x); });
  }

function addStop(word) {
    stopwords[word] = 1;
    vocabularySize--;
    delete wordTopicCounts[word];
  
      documents.forEach( function( currentDoc, i ) {
      var docTopicCounts = currentDoc.topicCounts;
      for (var position = 0; position < currentDoc.tokens.length; position++) {
        var token = currentDoc.tokens[position];
        if (token.word === word) {
          token.isStopword = true;
          tokensPerTopic[ token.topic ]--;
          docTopicCounts[ token.topic ]--;
        }
      }
    });
  
    sortTopicWords();
    displayTopicWords();
    reorderDocuments();
    vocabTable();
  }

function removeStop(word) {
    delete stopwords[word];
    vocabularySize++;
    wordTopicCounts[word] = {};
    var currentWordTopicCounts = wordTopicCounts[ word ];
  
      documents.forEach( function( currentDoc, i ) {
      var docTopicCounts = currentDoc.topicCounts;
      for (var position = 0; position < currentDoc.tokens.length; position++) {
        var token = currentDoc.tokens[position];
        if (token.word === word) {
          token.isStopword = false;
          tokensPerTopic[ token.topic ]++;
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
  
    sortTopicWords();
    displayTopicWords();
    reorderDocuments();
    vocabTable();
  }

