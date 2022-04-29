import React, {Component, ReactElement} from 'react';
import LabeledToggleButton from 'Components/LabeledToggleButton';
import { LDAModel } from 'core';

interface TutorialContollerProps{
    tutorialOn: boolean,
    tutorialOptions: any
    selectedTab: string
}
interface TutorialContollerState{
    tutorialOn:boolean
    tutorialOptions: any
}

/**
 * @summary a class for switching between tutorial mode
 * @requires
 */
export class TutorialContoller extends Component<TutorialContollerProps, TutorialContollerState>{
    constructor(props:TutorialContollerProps) {
        super(props);
        this.state = {
            tutorialOn: this.props.tutorialOn,
            tutorialOptions: this.props.tutorialOptions
        };
    }

    toggleChange(){
        this.setState({
            tutorialOn: !this.state.tutorialOn
        })
    }

    checkOptions(){
        // console.log(this.props.selectedTab)
        if (this.state.tutorialOptions.size === 8 && this.state.tutorialOn){
            console.log("tutorials done")
            this.restartTutorial()
        } else if (this.state.tutorialOptions.size === 7){
            this.state.tutorialOptions.set("restart", true)
        } else {
        let tab = this.props.selectedTab
        this.state.tutorialOptions.set(tab, false)
        }
    }

    restartTutorial(){
        if (window.confirm("Tutorials finished! Do you want to restart tutorials?") == true) {
            console.log("Restart Tutorial.")
			this.state.tutorialOptions.clear()
		} else {
            this.toggleChange()
            console.log("Tutorial ends")
		}
    }

    createToggle(){
        this.checkOptions()
        let message ='';
        if(this.state.tutorialOn){
            message = " ON."
            console.log("tutorial mode is applied")
            console.log(this.state.tutorialOptions)
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