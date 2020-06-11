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
            sumDocSortSmoothing: 0
        };
        console.log(props);
      }

    reorderDocuments = () => {
        var format = d3.format(".2g");
      
        if (this.props.selectedTopic === -1) {
          this.props.documents.sort(function(a, b) { return d3.ascending(a.originalOrder, b.originalOrder); });
          d3.selectAll("div.document").data(this.props.documents)
            .style("display", "block")
            .text((d) => { return "[" + d.id + "] " + this.props.truncate(d.originalText); });
        }
        else {
          var scores = this.props.documents.map(function (doc, i) {
            return {docID: i, score: (doc.topicCounts[this.props.selectedTopic] + this.state.docSortSmoothing) / (doc.tokens.length + this.state.sumDocSortSmoothing)};
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
            .style("display", function(d) { return this.props.documents[d.docID].topicCounts[this.props.selectedTopic] > 0 ? "block" : "none"; })
            .text(function(d) { return "[" + this.props.documents[d.docID].id + "/" + format(d.score * 100) + "%] " + this.props.truncate(this.props.documents[d.docID].originalText); });
         }
      }
    
    
    componentDidMount() {
        this.setState({sumDocSortSmoothing:this.state.docSortSmoothing * this.props.numTopics});
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