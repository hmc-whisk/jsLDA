import React, {ChangeEvent, FormEvent, SyntheticEvent} from "react";
import './header.css';

interface NumTopicSliderProps{
    onChange:(event:ChangeEvent<HTMLInputElement>)=>void,
    sliderValue:number,
    updateNumTopics:(val:string)=>void,
    onInput:(event:FormEvent<HTMLInputElement>)=>void,
    modelIsRunning:boolean
}

interface NumTopicSliderState{}

export class NumTopicSlider extends React.Component<NumTopicSliderProps,NumTopicSliderState> {

    handleChange(e:SyntheticEvent<HTMLInputElement>){
        this.props.updateNumTopics((e.target as HTMLInputElement).value);
    }

    render() {
        return (
            <div style={{display: "flex", justifyContent: "center", margin: "10px"}}>
                <span id="num_topics_control">
                    Train with
                    <input id="num-topics-input" type="range" name="topics"
                           onChange={this.handleChange.bind(this)}
                           value={this.props.sliderValue}
                           min="3" max="100"
                           disabled={this.props.modelIsRunning}
                           onMouseUp={this.handleChange.bind(this)}
                           onInput={this.props.onInput}
                    />
                    <span id="num_topics_display"> </span>
                    {this.props.sliderValue} Topics
                </span>
            </div>
        );
    }
}

export default NumTopicSlider;


