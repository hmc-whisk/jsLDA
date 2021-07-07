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
                    &nbsp;
                    <input id="num-topics-input" type="range" name="topics"
                        onChange={this.handleChange.bind(this)}
                        value={this.props.sliderValue}
                        min="3" max="100"
                        disabled={this.props.modelIsRunning}
                        onMouseUp={this.handleChange.bind(this)}
                        onInput={this.props.onInput}
                    />
                    &nbsp;
                    {this.props.sliderValue} Topics
                    &nbsp;
                    <button
                        type="submit"
                        id="submitTopNum"
                        className="darkButton"
                        onClick={this.handleSubmit.bind(this)}
                        > Update
                    </button>
                    &nbsp;
                </span>
            </div>
        );
    }
}

export default NumTopicSlider;


