import React from "react";
import * as d3 from "d3"

// d3.select("#dl-tab").on("click", function() {
//     d3.selectAll(".page").style("display", "none");
//     d3.selectAll("ul li").attr("class", "");
//     d3.select("#dl-page").style("display", "block");
//     d3.select("#dl-tab").attr("class", "selected");
//   });
  
//   // Functions for download links
//   function toURL(s, type) {
//       // Chrome will not process data URIs larger than 2M
//       if (s.length < 1500000) {
//         return "data:Content-type:" + type + ";charset=UTF-8," + encodeURIComponent(s);
//       }
//       else {
//         var blob = new Blob([s], {type: type});
//         return window.URL.createObjectURL(blob);
//       }
//     }
    
//   function saveDocTopics() {
//       var docTopicsCSV = "";
//       var topicProbabilities = zeros(numTopics);
    
//       documents.forEach(function(d, i) {
//       docTopicsCSV += d.id + "," + d.topicCounts.map(function (x) { return eightDigits(x / d.tokens.length); }).join(",") + "\n";
//   });
    
//       d3.select("#doctopics-dl").attr("href", toURL(docTopicsCSV, "text/csv"));
//     }
    
//   function saveTopicWords() {
//       var topicWordsCSV = "word," + d3.range(0, numTopics).map(function(t) {return "topic" + t; } ).join(",") + "\n";
//         for (var word in wordTopicCounts) {
//           var topicProbabilities = zeros(numTopics);
//           for (var topic in wordTopicCounts[word]) {
//             topicProbabilities[topic] = eightDigits(wordTopicCounts[word][topic] / tokensPerTopic[topic]);
//           }
//         topicWordsCSV += word + "," + topicProbabilities.join(",") + "\n";
//         }
    
//       d3.select("#topicwords-dl").attr("href", toURL(topicWordsCSV, "text/csv"));
//     }
    
//   function saveTopicKeys() {
//       var keysCSV = "Topic,TokenCount,Words\n";
    
//       if (topicWordCounts.length == 0) { sortTopicWords(); }
    
//         for (var topic = 0; topic < numTopics; topic++) {
//         keysCSV += topic + "," + tokensPerTopic[topic] + ",\"" + topNWords(topicWordCounts[topic], 10) + "\"\n";
//         }
    
//       d3.select("#keys-dl").attr("href", toURL(keysCSV, "text/csv"));
//     }
    
//   function saveTopicPMI() {
//       var pmiCSV = "";
//       var matrix = getTopicCorrelations();
    
//         matrix.forEach(function(row) { pmiCSV += row.map(function (x) { return eightDigits(x); }).join(",") + "\n"; });
    
//       d3.select("#topictopic-dl").attr("href", toURL(pmiCSV, "text/csv"));
//     }
    
//   function saveGraph() {
//       var graphCSV = "Source,Target,Weight,Type\n";
//         var topicProbabilities = zeros(numTopics);
    
//         documents.forEach(function(d, i) {
//         d.topicCounts.forEach(function(x, topic) {
//           if (x > 0.0) {
//             graphCSV += d.id + "," + topic + "," + eightDigits(x / d.tokens.length) + ",undirected\n";
//           }
//         });
//       });
    
//       d3.select("#graph-dl").attr("href", toURL(graphCSV, "text/csv"));
//     }
    
//   function saveState() {
//       var state = "DocID,Word,Topic";
//       documents.forEach(function(d, docID) {
//         d.tokens.forEach(function(token, position) {
//           if (! token.isStopword) {
//             state += docID + ",\"" + token.word + "\"," + token.topic + "\n";
//           }
//         });
//       });
    
//       d3.select("#state-dl").attr("href", toURL(state, "text/csv"));
//     }


class DLPage extends React.Component {

    render() {
        return (

            <div id="pages">

                <div id="dl-page" className="page">
                    <div className="help">Each file is in comma-separated format.</div>
                    <ul>
                        <li><a id="doctopics-dl" href="javascript:;" download="doctopics.csv" onClick="saveDocTopics()">Document topics</a></li>
                        <li><a id="topicwords-dl" href="javascript:;" download="topicwords.csv" onClick="saveTopicWords()">Topic words</a></li>
                        <li><a id="keys-dl" href="javascript:;" download="keys.csv" onClick="saveTopicKeys()">Topic summaries</a></li>
                        <li><a id="topictopic-dl" href="javascript:;" download="topictopic.csv" onClick="saveTopicPMI()">Topic-topic connections</a></li>
                        <li><a id="graph-dl" href="javascript:;" download="gephi.csv" onClick="saveGraph()">Doc-topic graph file (for Gephi)</a></li>
                        <li><a id="state-dl" href="javascript:;" download="state.csv" onClick="saveState()">Complete sampling state</a></li>
                    </ul>
                </div>

            </div>

        );
    }

}

export default DLPage;
