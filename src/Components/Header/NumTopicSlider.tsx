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
                    <button
                        type="submit"
                        id="submitTopNum"
                        className="configButton"
                        onClick={this.handleSubmit.bind(this)}
                        // style= {{paddingLeft:"px"}}
                        
                    > update
                    </button>
                    <span id="num_topics_display"> </span>
                    {this.props.sliderValue} Topics
                </span>
            </div>
        );
    }
}

export default NumTopicSlider;


