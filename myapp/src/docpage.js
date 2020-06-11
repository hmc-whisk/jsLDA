import React from "react";
// import PageDesc from "./pageDesc"
import Files from "./fileSelect"

class TopicDoc extends React.Component {

    render() {
        return (
            <div id="pages">

                <div id="docs-page" class="page">
                    <Files />
                    <div class="help">Documents are sorted by their proportion of the currently selected topic, biased
						to prefer longer documents.</div>

                </div>



            </div>
        );
    }

}

export default TopicDoc;

