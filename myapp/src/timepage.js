import React from "react";


class TimeSeries extends React.Component {

    render() {
        return (

            <div id="pages">

                <div id="docs-page" class="page">
                    <div class="help">Documents are grouped by their "date" field (the second column in the input file). These plots show the average document proportion of each topic at each date value. Date values are <i>not</i> parsed, but simply sorted in the order they appear in the input file.</div>

                </div>



            </div>

        );
    }

}

export default TimeSeries;
