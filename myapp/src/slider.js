import React from "react";

class Slider extends React.Component {

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

    }


    handleChange(e) {
        const val = e.target.value;
        this.props.onChange(val);
    }

    handleBlur(e) {
        const val = e.target.value;
        this.props.onBlur(val);
    }


    render() {
        return (

                <span id="num_topics_control">Train with <input id="num-topics-input" type="range" name="topics" value={this.props.sliderValue}
                    min="3" max="100" onChange={this.handleChange} onBlur={this.handleBlur} /> <span id="num_topics_display">  </span>  {this.props.sliderValue} Topics </span>
        );
    }

}

export default Slider;


