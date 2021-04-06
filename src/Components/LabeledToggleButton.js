import React, { Component } from 'react'; 
import Checkbox from '@material-ui/core/Checkbox';

/**
 * A standard labeled button to toggle anything
 */
class LabeledToggleButton extends Component {
    render() {
         return (
            <div className={"labeledToggleButton"} 
                 style={this.props.style}
                 id={this.props.id}>

                {this.props.label}
                <Checkbox
                    checked={this.props.checked}
                    onChange={this.props.onChange}
                    inputProps={{ 'aria-label': 'checkbox' }}
                    color="primary"
                />
            </div>
         )
    }
}

export default LabeledToggleButton