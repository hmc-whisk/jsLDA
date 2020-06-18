import React from "react";
import Slider from "./slider"
class Form extends React.Component {

    constructor(props) {
        super(props);

        this.state = {sliderValue:25};
        this.handleClick = this.handleClick.bind(this)
        this.updateNumDisplay = this.updateNumDisplay.bind(this);

    }

    handleClick() {
        this.props.onClick();
    }

    updateNumDisplay(event) {
        if(!event.target.value) {return}
        let val = event.target.value;
        this.setState({
            sliderValue: val
        });
    }


    render() {
        return (
            <div id="form" className="top">

                <button id="sweep" onClick={this.handleClick} >Run 50 iterations</button> Iterations: <span id="iters"> {this.props.iter} </span>
                <Slider 
                    onChange={this.updateNumDisplay} 
                    sliderValue = {this.state.sliderValue} 
                    updateNumTopics={this.props.updateNumTopics}
                    onInput={(event) => this.updateNumDisplay(event)}
                    /> 
            </div>
        );
    }

}

export default Form;


