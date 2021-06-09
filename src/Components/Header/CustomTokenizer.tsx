import React, {Component, SyntheticEvent} from 'react';
import './header.css';
import XRegExp from "xregexp";

interface CustomTokenizerProps {
    tokenRegex: RegExp
    changeTokenRegex: (inputRegex: RegExp) => void
}

interface CustomTokenizerState {
    inputRegex: string
}

class CustomTokenizer extends Component<CustomTokenizerProps, CustomTokenizerState> {
    state = {
        // @ts-ignore a bug in xregexp's type
        inputRegex: this.props.tokenRegex.xregexp.source
    }

    handleChange(e: SyntheticEvent<HTMLInputElement>) {
        this.setState({
            inputRegex: (e.target as HTMLInputElement).value
        })
    }

    handleSubmit(e: SyntheticEvent) {
        e.preventDefault();
        let newRegex;
        try {
            newRegex = XRegExp(this.state.inputRegex, "g");
            if (window.confirm('This will cause your model to reset.')) {
                this.props.changeTokenRegex(newRegex);
            }
        } catch (error) { // if XRegExp throws syntax error
            if (error instanceof SyntaxError) {
                window.alert("Please enter a valid regular expression.");
            }
        }
    }

    render() {
        return (
            <div className="configMenu">
                <h3>Tokenization</h3>
                <div>
                    <input onChange={this.handleChange.bind(this)} id="regex" value={this.state.inputRegex}/>
                    <button
                        type="submit"
                        id="submitRegex"
                        className="darkButton"
                        onClick={this.handleSubmit.bind(this)}
                        style={{marginLeft: "5px"}}
                    >
                        Change Tokenizer
                    </button>
                </div>
            </div>
        );
    }
}

export default CustomTokenizer;
