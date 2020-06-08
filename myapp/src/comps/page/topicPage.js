import React from "react";
import PageDesc from "./pageDesc"
import Files from "./fileSelect"

class TopicPage extends React.Component {

    render() {
        return (
            <div id="pages">

                <div id="docs-page" class="page">
                    <Files />

                </div>

            <PageDesc />

            </div>
        );
    }

}

export default TopicPage;
