import React from "react";
import NumTopicSlider from "./NumTopicSlider"
import Checkbox from '@material-ui/core/Checkbox';
import Configuration from './Configuration'
import Uploader from '../Pages/Uploader';

var backColor = getComputedStyle(document.documentElement).getPropertyValue('--color3');


class TopBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = { 
            sliderValue: props.numTopics, 
            formValue: this.props.sweepParameter,
            numTopics: props.numTopics,
            checked: false,
         };
    }


    static getDerivedStateFromProps(props, state) {
        if (props.numTopics !== state.numTopics) {
          return {
            sliderValue: props.numTopics,
            numTopics: props.numTopics
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

    handleCheck = (event) => {
        this.setState({checked: event.target.checked});
        this.props._hyperTune(event.target.checked);
      };

    helpTextStyle = {
        backgroundColor: backColor,
        position: "fixed",
        top: "10%",
        left: "30%",
        right:"30%",
        borderRadius: "20px 0px 0px 20px",
        margin: "10px",
        height: "70%",
        overflowY: "scroll"
    }

    get uploadHelp() {
        return (
            <Configuration
                displayElement={
                    <div style={this.helpTextStyle}>
                        <div style={{margin:"15px"}}>
                        <div className="upload"> 
                        <div style={{padding:'5px'}}>
                        <h3 > Topic Configuration</h3>
                        <h4 > Set number of topics</h4>

                        <NumTopicSlider
                        onChange={this.updateNumDisplay}
                        sliderValue={this.state.sliderValue}
                        updateNumTopics={this.confirmUpdate}
                        onInput={(event) => this.updateNumDisplay(event)}
                        modelIsRunning={this.props.modelIsRunning}
                        />

                        <br/>
                        </div>
                        <h4> 
                        
                        <Checkbox
                        checked={this.checked}
                        onChange={this.handleCheck}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                        color="primary"
                        />
                        Optimize topic concentrations</h4>
                        <i style={{padding:'15px'}}>Optimized topic correlation allow the model to account for </i>
                        <br/>
                        <i style={{padding:'15px'}}>different proportions of topics in each documents </i>
                        <br/>
                        <br/>

                        </div>

                        <Uploader 
                            onDocumentFileChange = {this.props.onDocumentFileChange}
                            onStopwordFileChange = {this.props.onStopwordFileChange}
                            onModelFileChange={this.props.onModelFileChange}
                            onFileUpload={this.props.onFileUpload}
                            onModelUpload={this.props.onModelUpload}
                            modelIsRunning = {this.props.modelIsRunning}
                            onDefaultDocChange = {this.props.onDefaultDocChange}
                            docName = {this.props.docName}
                        />
                        </div>
                    </div>
                }/>
        )
    }

    render() {
        console.log(this.props.iter);
        return (
            <div id="form" className="top">
                <form onSubmit = {this.handleSubmit} className = "topForm">
                    <label for="number">Enter Number of Iterations: &nbsp;</label>

                    <input onChange = {this.handleChange} id="number" type="number" value = {this.state.formValue} placeholder="# Sweeps" min="1" max="100000" required></input>

                    <button type = "submit" id="sweep" className="darkButton">Run {this.props.sweepParameter} iterations</button>

                    <button id="stopSweep" onClick={this.handleClick} className="darkButton" disabled={!this.props.modelIsRunning}>Stop</button>

                Iterations:<span id="iters" > {this.props.iter} </span>


                </form>
                {this.uploadHelp}

            </div>


        );
    }

}

// 


export default TopBar;


