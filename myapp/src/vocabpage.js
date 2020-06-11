import React from "react";


class VocabTable extends React.Component {

    render() {
        return (

            <div id="pages">

                <div id="docs-page" class="page">
                    <div class="help">Words occurring in only one topic have specificity 1.0, words evenly distributed among all topics have specificity 0.0. <button id="showStops">Show stopwords</button> </div>

                </div>



            </div>

        );
    }

}

export default VocabTable;
