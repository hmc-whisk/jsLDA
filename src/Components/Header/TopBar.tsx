import React, {ChangeEvent, CSSProperties, SyntheticEvent} from "react";
import NumTopicSlider from "./NumTopicSlider"
import Checkbox from '@material-ui/core/Checkbox';
import Configuration from './Configuration'
import Uploader from './Uploader';
import CustomTokenizer from './CustomTokenizer';
import './header.css';

interface TopBarProps {
    completeSweeps: number,
    requestedSweeps: number,
    numTopics: number,
    onClick: () => void,
    updateNumTopics: (val: string) => void,
    sweepParameter: number,
    hyperTune: (tune: boolean) => void,
    bigrams: (bigramStatus: boolean) => void,
    onChange: (val: string) => void,
    stopButtonClick: () => void,
    iter: number,
    modelIsRunning: boolean,
    onDocumentFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onStopwordFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onModelFileChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onFileUpload: () => void,
    onModelUpload: () => void,
    onDefaultDocChange: (event: ChangeEvent<HTMLSelectElement>) => void,
    docName: string,
    optimizeValue: boolean,
    bigramValue: boolean,
    tokenRegex: RegExp,
    changeTokenRegex: (inputRegex: RegExp) => void
}

interface TopBarState {
    sliderValue: number,
    formValue: string,
    numTopics: number,
    checkedOptimize: boolean,
    checkedBigram: boolean
}

class TopBar extends React.Component<TopBarProps, TopBarState> {

    constructor(props:TopBarProps) {
        super(props);

        this.state = {
            sliderValue: props.numTopics,
            formValue: this.props.sweepParameter.toString(),
            numTopics: props.numTopics,
            checkedOptimize: this.props.optimizeValue,
            checkedBigram: this.props.bigramValue,
        };
    }


    static getDerivedStateFromProps(props: TopBarProps, state: TopBarState) {
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
    handleSubmit(event: SyntheticEvent) {
        //  TODO Check back with onClick, can it be reduces to songle function, or renate
        event.preventDefault();
        this.props.onClick();
    }

    /**
     * @summary Calls the function that will stop the model
     */
    handleClick<E extends SyntheticEvent>(event: E) {
        this.props.stopButtonClick();
        event.preventDefault();
    }

    /**
     * @summary This function updates the value being displayed on slider as user drags it around
     */

    updateNumDisplay(event: SyntheticEvent<HTMLInputElement>) {
        let target = event.target as HTMLInputElement;
        if (!target.value) {
            return
        }
        let val = parseInt(target.value);
        this.setState({
            sliderValue: val
        });
    }

    /**
     * @summary This value sets the display used for the run # iteratison
     */
    handleChange(event: ChangeEvent<HTMLInputElement>) {

        // Forces display value number or 0 (avoids NaN) on run button
        const val = event.target.value;
        this.setState({formValue: val});
        if (val === "")
            this.props.onChange("0");
        else
            this.props.onChange(val);


    }

    /**
     * @summary This function handles reseting the entire model
     * as well as moving slider if the user does not wish to reset the model.
     */
    confirmUpdate(val: string) {
        // does not use confrimReset bc of the slider needs to reset to original positions
        if (window.confirm('This will cause your model to reset.')) {
            this.props.updateNumTopics(val);
        } else {
            this.setState({
                sliderValue: this.props.numTopics
            });
        }

    }

    /**
     * @summary This function handles changing the bigram option
     */
    confirmBigramUpdate(checked: boolean) {
        // does not use confrimReset bc of the slider needs to reset to original positions
        if (window.confirm('This will take some time and may result in loss of data.')) {
            this.setState({checkedBigram: checked});
            this.props.bigrams(checked);
        }
    }

    handleCheckOptimize(event: ChangeEvent<HTMLInputElement>) {
        this.setState({checkedOptimize: event.target.checked});
        this.props.hyperTune(event.target.checked);
    };

    handleCheckBigram(event: ChangeEvent<HTMLInputElement>) {
        this.confirmBigramUpdate(event.target.checked);
    };

    helpTextStyle: CSSProperties = {
        backgroundColor: "var(--color3)",
        position: "fixed",
        top: "10%",
        left: "30%",
        right: "30%",
        borderRadius: "20px 0px 0px 20px",
        margin: "10px",
        height: "70%",
        overflowY: "scroll"
    }

    get configuration() {
        return (
            <Configuration
                displayElement={
                    <div style={this.helpTextStyle}>
                        <div style={{margin: "15px"}}>
                            <div className="configMenu">
                                <h3> Topics </h3>
                                <div>
                                    <h5> Set number of topics: </h5>
                                    <NumTopicSlider
                                        onChange={this.updateNumDisplay.bind(this)}
                                        sliderValue={this.state.sliderValue}
                                        updateNumTopics={this.confirmUpdate.bind(this)}
                                        onInput={this.updateNumDisplay.bind(this)}
                                        modelIsRunning={this.props.modelIsRunning}
                                    />

                                    <h6>
                                        <Checkbox
                                            onChange={this.handleCheckOptimize.bind(this)}
                                            inputProps={{'aria-label': 'primary checkbox'}}
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
                                            onChange={this.handleCheckBigram.bind(this)}
                                            inputProps={{'aria-label': 'primary checkbox'}}
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
                <form onSubmit={this.handleSubmit.bind(this)} className="topForm">
                    <label htmlFor="number">Enter Number of Iterations: &nbsp;</label>

                    <input onChange={this.handleChange.bind(this)} id="number" type="number"
                           value={this.state.formValue}
                           placeholder="# Sweeps" min="1" max="100000" required/>

                    <button type="submit" id="sweep" className="darkButton">Run {this.props.sweepParameter} iterations
                    </button>

                    <button id="stopSweep" onClick={this.handleClick.bind(this)} className="darkButton"
                            disabled={!this.props.modelIsRunning}>Stop
                    </button>

                    Iterations:<span id="iters"> {this.props.iter} </span>


                </form>
                {this.configuration}
            </div>


        );
    }

}

//


export default TopBar;


