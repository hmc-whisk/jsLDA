import React from "react";

class Slider extends React.Component {

    constructor(props) {
        super(props);
    }


    handleChange = (e) => {
        const val = e.target.value;
        this.props.updateNumTopics(val);
    }


    render() {
        return (

                <span id="num_topics_control">
                    Train with 
                    <input id="num-topics-input" type="range" name="topics" 
                        value={this.props.sliderValue}
                        min="3" max="100" 
                        onMouseUp={(e) => this.handleChange(e)}
                        onInput={(e) => this.props.onInput(e)}
                        /> 
                    <span id="num_topics_display"> </span>  
                    {this.props.sliderValue} Topics
                </span>
        );
    }

}

export default Slider;


