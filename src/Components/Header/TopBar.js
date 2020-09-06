import React from "react";
import NumTopicSlider from "./NumTopicSlider"
class TopBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = { sliderValue: 25, formValue: 50 };
    
    }

    static getDerivedStateFromProps(props, state) {
        if (props.numTopics !== state.sliderValue) {
          return {
            sliderValue: props.numTopics,
          };
        }
        
        // Return null if the state hasn't changed
        return null;
    }

    /**
     * @summary 
     */
    handleSubmit = (event) => {
        //  TODO Check back with onClick, can it be reduces to songle function, or renate
        this.props.onClick();
        event.preventDefault();
    }

    /**
     * @summary Calls the function that will stop the model 
     */
    handleClick = (event) => {
        this.props.stopButtonClick();
        event.preventDefault();
    }
    /**
     * @summary This function updates the value being displayed on slider as user drags it around
     */
    updateNumDisplay = (event) => {
        if (!event.target.value) { return }
        let val = event.target.value;
        this.setState({
            sliderValue: val
        });
    }
    /**
     * @summary This value sets the display used for the run # iteratison
     */
    handleChange = (event) => {

        // Forces display value number or 0 (avoids NaN) on run button  
        const val = event.target.value;  
        this.setState({formValue: val});
        if(val === "")      
            this.props.onChange(0);  
        else
            this.props.onChange(val);  

        
    }
    /**
     * @summary This function handles reseting the entire model
     * as well as moving slider if the user does not wish to reset the model.
     */
    confirmUpdate = (val) => {
        // does not use confrimReset bc of the slider needs to reset to original positions
        if (window.confirm('This will cause your model to reset.')) {
            this.props.updateNumTopics(val);
        }
        else{
            this.setState({
                sliderValue: this.props.numTopics
            });
        }

    }


    render() {
        return (
            <div id="form" className="top">
                <form onSubmit = {this.handleSubmit} className = "topForm">
                    <label for="number">Enter Number of Iterations: &nbsp;</label>

                    <input onChange = {this.handleChange} id="number" type="number" value = {this.state.formValue} placeholder="# Sweeps" min="1" max="100000" required></input>

                    <button type = "submit" id="sweep" className="darkButton">Run {this.props.sweepParameter} iterations</button>

                    <button id="stopSweep" onClick={this.handleClick} className="darkButton" disabled={!this.props.modelIsRunning}>Stop</button>

                Iterations:<span id="iters" > {this.props.iter} </span>

                    <NumTopicSlider
                        onChange={this.updateNumDisplay}
                        sliderValue={this.state.sliderValue}
                        updateNumTopics={this.confirmUpdate}
                        onInput={(event) => this.updateNumDisplay(event)}
                        modelIsRunning={this.props.modelIsRunning}
                    />
                </form>
            </div>


        );
    }

}

// 


export default TopBar;


