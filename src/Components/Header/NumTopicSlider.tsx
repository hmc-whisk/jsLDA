import React, {ChangeEvent, FormEvent, SyntheticEvent} from "react";
import './header.css';

interface NumTopicSliderProps{
    onChange:(event:ChangeEvent<HTMLInputElement>)=>void,
    sliderValue:number,
    updateNumTopics:(val:string)=>void,
    onInput:(event:FormEvent<HTMLInputElement>)=>void,
    modelIsRunning:boolean
}

interface NumTopicSliderState{
    numTop:string
}

export class NumTopicSlider extends React.Component<NumTopicSliderProps,NumTopicSliderState> {
    constructor(props:NumTopicSliderProps) {
        super(props);
        this.state = {
          numTop: "25"
        };
      }

    handleChange(e:SyntheticEvent<HTMLInputElement>){
        if (!(e.target as HTMLInputElement).value || parseInt((e.target as HTMLInputElement).value) <=0)
            this.setState({
                numTop:"1"
            })
        else 
        this.setState({
            numTop:(e.target as HTMLInputElement).value
        })
    }

    handleSubmit(e: SyntheticEvent) {
        this.props.updateNumTopics(this.state.numTop);
    }

    render() {
        return (
            <div style={{display: "flex", margin: "5px"}}>
                <span id="num_topics_control">
                Set number of topics: 
                    {/* <input id="num-topics-input" type="range" name="topics"
                        onChange={this.handleChange.bind(this)}
                        value={this.props.sliderValue}
                        min="3" max="100"
                        disabled={this.props.modelIsRunning}
                        onMouseUp={this.handleChange.bind(this)}
                        onInput={this.props.onInput}
                    /> */}
                    &nbsp;
                    <input id="num-topics-input"
                        onChange={this.handleChange.bind(this)}
                        type="number"
                        defaultValue={this.state.numTop}
                        placeholder="# bins"
                        max="100"
                        min="5"
                        step="5"
                        style={{position:"relative", left:0}}
                    />
                    &nbsp;
                    {/* {this.props.sliderValue}  */}
                    Topics
                    &nbsp;
                    <button
                        type="submit"
                        id="submitTopNum"
                        className="darkButton"
                        onClick={this.handleSubmit.bind(this)}
                        disabled={this.props.modelIsRunning}
                        > Update
                    </button>
                    &nbsp;
                </span>
            </div>
        );
    }
}

export default NumTopicSlider;


