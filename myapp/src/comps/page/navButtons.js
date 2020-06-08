import React from "react";

class Nav extends React.Component {

    render() {
        return (
            <div className="tabs">
				<ul>
					<li id="docs-tab" class="selected">Topic Documents</li>
					<li id="corr-tab">Topic Correlations</li>
					<li id="ts-tab">Time Series</li>

					<li id="dl-tab">Downloads</li>
					<li id="vocab-tab">Vocabulary</li>
				</ul>
			</div>
        );
    }

}

export default Nav;
