import React from "react";
import NumTopicSlider from "./NumTopicSlider"
class TopBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = { sliderValue: 25, formValue: 50 };
    
    }

    handleSubmit = (event) => {
        this.props.onClick();
        event.preventDefault();
    }

    handleClick = (event) => {
        this.props.stopButtonClick();
        event.preventDefault();
    }

    updateNumDisplay = (event) => {
        if (!event.target.value) { return }
        let val = event.target.value;
        this.setState({
            sliderValue: val
        });
    }
    handleChange = (event) => {
        // Either value number or 1 (avoids NaN)
        
        const val = event.target.value;  
        this.setState({formValue: val});
        if(val == "")      
            this.props.onChange(0);  
        else
            this.props.onChange(val);  

        
    }


    render() {
        return (
            <div id="form" className="top">
                <form onSubmit = {this.handleSubmit}>
                    <label for="number">Enter Number of Iterations: &nbsp;</label>

                    <input onChange = {this.handleChange} id="number" type="number" value = {this.state.formValue} placeholder="# Sweeps" min="1" max="100000" required></input>

                    <button type = "submit" id="sweep" className = "button">Run {this.props.sweepParameter} iterations</button>

                    <button id="stopSweep" onClick={this.handleClick} className = "button" disabled={!this.props.modelIsRunning}>Stop</button>

                Iterations:<span id="iters" > {this.props.iter} </span>

                    <NumTopicSlider
                        onChange={this.updateNumDisplay}
                        sliderValue={this.state.sliderValue}
                        updateNumTopics={this.props.updateNumTopics}
                        onInput={(event) => this.updateNumDisplay(event)}
                        modelIsRunning={this.props.modelIsRunning}
                    />
                </form>
            </div>


        );
    }

}

export default TopBar;


