import React from "react";
import NumTopicSlider from "./NumTopicSlider"
import Checkbox from '@material-ui/core/Checkbox';
import Configuration from './Configuration'
import Uploader from './Uploader';
import CustomTokenizer from './CustomTokenizer';
import './header.css';

class TopBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = { 
            sliderValue: props.numTopics, 
            formValue: this.props.sweepParameter,
            numTopics: props.numTopics,
            checkedOptimize: this.props.optimizeValue,
            checkedBigram: this.props.bigramValue,
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

    /**
     * @summary This function handles changing the bigram option
     */
     confirmBigramUpdate = (checked) => {
        // does not use confrimReset bc of the slider needs to reset to original positions
        if (window.confirm('This will take some time and may result in loss of data.')) {
            this.setState({checkedBigram: checked});
            this.props.bigrams(checked);}
    }

    handleCheckOptimize = (event) => {
        this.setState({checkedOptimize: event.target.checked});
        this.props.hyperTune(event.target.checked);
      };
    
    handleCheckBigram = (event) => {
        this.confirmBigramUpdate(event.target.checked);
    };

    helpTextStyle = {
        backgroundColor: "var(--color3)",
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
                            <div className="configMenu"> 
                                <h3> Topics </h3>
                                <div>
                                    <h5> Set number of topics: </h5>
                                    <NumTopicSlider
                                        onChange={this.updateNumDisplay}
                                        sliderValue={this.state.sliderValue}
                                        updateNumTopics={this.confirmUpdate}
                                        onInput={(event) => this.updateNumDisplay(event)}
                                        modelIsRunning={this.props.modelIsRunning}
                                    />

                                    <h6>
                                        <Checkbox
                                            checked={this.checked}
                                            onChange={this.handleCheck}
                                            inputProps={{ 'aria-label': 'primary checkbox' }}
                                            color="primary"
                                            style={{paddingLeft: "0"}}
                                        />
                                        Optimize topic concentrations
                                    </h6>

                                    <i> Optimized topic correlation allow the model to account for </i>
                                    <i> different proportions of topics in each documents </i>
                                </div>
                            </div>

                        <div className="configMenu"> 
                            <h3> Vocabulary </h3>
                            <div>
                                <h6> 
                                    <Checkbox
                                    checked={this.checkedBigram}
                                    onChange={this.handleCheckBigram}
                                    inputProps={{ 'aria-label': 'primary checkbox' }}
                                    color="primary"
                                    style={{paddingLeft: "0"}}
                                    />
                                    Allow bigrams
                                </h6>
                                <i>Allows bigrams to be accounted for in the model.</i>
                            </div>
                        </div>

                        

                        <Uploader 
                            onDocumentFileChange={this.props.onDocumentFileChange}
                            onStopwordFileChange={this.props.onStopwordFileChange}
                            onModelFileChange={this.props.onModelFileChange}
                            onFileUpload={this.props.onFileUpload}
                            onModelUpload={this.props.onModelUpload}
                            modelIsRunning={this.props.modelIsRunning}
                            onDefaultDocChange={this.props.onDefaultDocChange}
                            docName={this.props.docName}
                        />

                        <CustomTokenizer
                            tokenRegex={this.props.tokenRegex}
                            changeTokenRegex={this.props.changeTokenRegex}
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
                    <label htmlFor="number">Enter Number of Iterations: &nbsp;</label>

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


