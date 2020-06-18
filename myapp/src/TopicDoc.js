import React, { Component } from 'react'; 
import * as d3 from 'd3';
import Uploader from './Uploader';

/////@TODO rename this file to TopicDoc.js?/////
/*
 * @todo give this class doc strings
**/
class TopicDoc extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // used by reorderDocuments
            docSortSmoothing: 10.0,
        };
      }

    reorderDocuments = () => {
        var format = d3.format(".2g");
        let selectedTopic = this.props.selectedTopic;
        let docSortSmoothing = this.state.docSortSmoothing;
        let documents = this.props.documents;
        let truncate = this.props.truncate;
        let sumDocSortSmoothing = this.state.docSortSmoothing * this.props.numTopics;
      
        if (this.props.selectedTopic === -1) {
          this.props.documents.sort(function(a, b) { return d3.ascending(a.originalOrder, b.originalOrder); });
          d3.selectAll("div.document").data(this.props.documents)
            .style("display", "block")
            .text((d) => { return "[" + d.id + "] " + this.props.truncate(d.originalText); });
        }
        else {
          var scores = this.props.documents.map(function (doc, i) {
            return {docID: i, score: (doc.topicCounts[selectedTopic] + docSortSmoothing) / (doc.tokens.length + sumDocSortSmoothing)};
          });
          scores.sort(function(a, b) {
            return b.score - a.score;
          });
          /*documents.sort(function(a, b) {
              var score1 = (a.topicCounts[selectedTopic] + docSortSmoothing) / (a.tokens.length + sumDocSortSmoothing);
              var score2 = (b.topicCounts[selectedTopic] + docSortSmoothing) / (b.tokens.length + sumDocSortSmoothing);
              return d3.descending(score1, score2);
          }); */
          // Put in render?
          d3.selectAll("div.document").data(scores)
            .style("display", function(d) { return documents[d.docID].topicCounts[selectedTopic] > 0 ? "block" : "none"; })
            .text(function(d) { return "[" + documents[d.docID].id + "/" + format(d.score * 100) + "%] " + truncate(documents[d.docID].originalText); });
         }
      }
    
    
    componentDidMount() {
      let truncate = this.props.truncate;
      this.props.documents.forEach(function (d) {
        d3.select("div#docs-page").append("div")
        .attr("class", "document")
        .text("[" + d.id + "] " + truncate(d.originalText));
      })
      this.reorderDocuments();      
    }

    componentDidUpdate(prevProps) {
        this.reorderDocuments();
    }

    render() {
        return (
            <div id="docs-page" className="page">
                <Uploader onDocumentFileChange = {this.props.onDocumentFileChange}
                          onStopwordFileChange = {this.props.onStopwordFileChange}
                          onFileUpload = {this.props.onFileUpload}/>
            <div className="help">Documents are sorted by their proportion of the currently selected topic, biased to prefer longer documents.</div>
            </div>
        )
    }
}

export default TopicDoc