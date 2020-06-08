import React from "react";

class Form extends React.Component {

    render() {
        return (
            <div id="form" className="top">

                <button id="sweep">Run 50 iterations</button> Iterations: <span id="iters">0</span>

                <span id="num_topics_control">Train with <input id="num-topics-input" type="range" name="topics" value="25"
                    min="3" max="100" oninput="updateTopicCount(this)" onchange="onTopicsChange(this)" /> <span
                        id="num_topics_display">25</span> topics</span>
            </div>
        );
    }

}

export default Form;


