import React from "react";
import NumTopicSlider from "./NumTopicSlider"
class TopBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {sliderValue:25};

    }

    handleClick = () => {
        this.props.onClick();
    }

    updateNumDisplay = (event) => {
        if(!event.target.value) {return}
        let val = event.target.value;
        this.setState({
            sliderValue: val
        });
    }
    handleChange = (event) => {
        // Either value number or 1 (avoids NaN)
        const val = event.target.value || 1;

        this.props.onChange(val);
    }


    render() {
        return (
            <div id="form" className="top">
                Enter Number of Iterations: &nbsp;
                <input onChange = {this.handleChange} value = {this.props.sweepParameter} type="text" pattern="\d*" maxlength="5" size = "5"/>
                <button id="sweep" onClick={this.handleClick} >Run {this.props.sweepParameter} iterations</button> 
                <button id="stopSweep" onClick={() => this.props.stopButtonClick()}>Stop</button>
                Iterations:<span id="iters" > {this.props.iter} </span>
                <NumTopicSlider 
                    onChange={this.updateNumDisplay} 
                    sliderValue = {this.state.sliderValue} 
                    updateNumTopics={this.props.updateNumTopics}
                    onInput={(event) => this.updateNumDisplay(event)}
                    modelIsRunning = {this.props.modelIsRunning}
                    /> 
            </div>
        );
    }

}

export default TopBar;


