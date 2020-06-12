import React from "react";


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
