import React from "react";

class Form extends React.Component {

    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    handleClick() {

        this.props.onClick();
    }

    handleChange(e) {
        const val = e.target.value;
        this.props.onChange(val);
    }


    render() {
        return (
            <div id="form" className="top">

                <button id="sweep" onClick={this.handleClick}>Run 50 iterations</button> Iterations: <span id="iters"> {this.props.iter} </span>

                <span id="num_topics_control">Train with <input id="num-topics-input" type="range" name="topics" value = {this.props.numTopics} 
                    min="3" max="100" onChange={this.handleChange} /> <span id="num_topics_display">  </span>  { this.props.numTopics } Topics </span>
            </div>
        );
    }

}

export default Form;


