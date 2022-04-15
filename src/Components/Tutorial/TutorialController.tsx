import React, {Component, ReactElement} from 'react';
import LabeledToggleButton from 'Components/LabeledToggleButton';
import { LDAModel } from 'core';

interface TutorialContollerProps{}
interface TutorialContollerState{
    tutorialOn: boolean
}

/**
 * @summary a class for switching between tutorial mode
 * @requires
 */
export class TutorialContoller extends Component<TutorialContollerProps, TutorialContollerState>{
    constructor(props:TutorialContollerProps) {
        super(props);
        this.state = {
            tutorialOn: true
        };
    }

    toggleChange(){
        this.setState({
            tutorialOn: !this.state.tutorialOn
        })
    }

    createToggle(){
        let message ='';
        if(this.state.tutorialOn){
            message = " ON."
            console.log("tutorial mode is applied")
        } else {
            message = " OFF."
            console.log("tutorial mode is off")
        }

        return (
        <div id="buttons" style={{display:"flex", marginLeft  :"10" }}>
            <LabeledToggleButton
              id="toggle"
              label={"Tutorial Mode is" + (message) }
              style={{
                borderTopRightRadius: "10px",
                borderBottomRightRadius: "10px",
                borderTopLeftRadius:"10px",
                borderBottomLeftRadius:"10px"}}
              checked={this.state.tutorialOn}
              onChange={this.toggleChange.bind(this)}
            />
        </div>
        )
    }

    render() {
        return(
            <div >
                {this.createToggle()}
            </div>
        )
    }
}

export default TutorialContoller;