import React from "react";
import NumTopicSlider from "./NumTopicSlider"
class TopBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = { sliderValue: 25 };

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
        const val = event.target.value||0;
        
        // if (val === NaN || val === 0) {
        //     val = 1;
        //     console.log("val is now " + val)
        // }

        this.props.onChange(val);
    }


    render() {
        return (
            <div id="form" className="top">
                <form onSubmit = {this.handleSubmit}>
                    <label for="number">Enter Number of Iterations: &nbsp;</label>

                    <input onChange = {this.handleChange} id="number" type="number" placeholder="50" min="1" max="100000" id="number" required></input>

                    <button type = "submit" id="sweep" >Run {this.props.sweepParameter} iterations</button>

                    <button id="stopSweep" onClick={this.handleClick} disabled={!this.props.modelIsRunning}>Stop</button>

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


