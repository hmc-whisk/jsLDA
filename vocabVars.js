displayingStopwords // in processvars (used by vocabTable, #showstops)
sortVocabByTopic // in processvars (used by vocabTable, #sortVocabByTopic)
vocabularyCounts // in processvars (used by mostFrequentWords)
wordTopicCounts // in processvars (used by mostFrequentWords, specificity, addStop, removeStop)
selectedTopic // in processvars (used by mostFrequentWords)
stopwords // in processvars (used by mostFrequentWords, vocabTable, addStop, removeStop)
numTopics // in processvars (used by specificity)
vocabularySize // in processvars (used by addStop, removeStop)
tokensPerTopic // in processvars (used by addStop, removeStop)
documents // in processvars (used by addStop, removeStop)
byCountDescending // in processvars (used by mostFrequentWords)

// Used by vocabTable
d3.select("#vocab-tab").on("click", function() {
    d3.selectAll(".page").style("display", "none");
    d3.selectAll("ul li").attr("class", "");
    d3.select("#vocab-page").style("display", "block");
    d3.select("#vocab-tab").attr("class", "selected");
  });