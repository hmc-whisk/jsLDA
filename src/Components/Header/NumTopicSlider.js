import React from "react";
import './header.css';

class NumTopicSlider extends React.Component {


    handleChange = (e) => {
        const val = e.target.value;
        this.props.updateNumTopics(val);
    }


    render() {
        return (
            <div style={{display: "flex", justifyContent: "center"}}>
                <span id="num_topics_control">
                    Train with 
                    <input id="num-topics-input" type="range" name="topics" 
                        value={this.props.sliderValue}
                        min="3" max="100" 
                        disabled = {this.props.modelIsRunning}
                        onMouseUp={(e) => this.handleChange(e)}
                        onInput={(e) => this.props.onInput(e)}
                    />
                    <span id="num_topics_display"> </span>  
                    {this.props.sliderValue} Topics
                </span>
            </div>
        );
    }

}

export default NumTopicSlider;


