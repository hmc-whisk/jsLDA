import React, {ChangeEventHandler, Component} from 'react';
import Checkbox from '@material-ui/core/Checkbox';

/**
 * A standard labeled button to toggle anything
 */
export class LabeledToggleButton extends Component<{
    style: React.CSSProperties,
    id: string,
    label: string,
    checked: boolean,
    onChange: ChangeEventHandler
}> {
    render() {
        return (
            <div className={"labeledToggleButton"}
                 style={this.props.style}
                 id={this.props.id}>

                {this.props.label}
                <Checkbox
                    checked={this.props.checked}
                    onChange={this.props.onChange}
                    inputProps={{'aria-label': 'checkbox'}}
                    color="primary"
                />
            </div>
        )
    }
}

export default LabeledToggleButton
