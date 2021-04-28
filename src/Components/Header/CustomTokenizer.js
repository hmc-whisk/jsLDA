import React, { Component } from 'react';
import './header.css';

var XRegExp = require('xregexp');

class CustomTokenizer extends Component {
    state = {
        inputRegex: this.props.tokenRegex.xregexp.source
    }

    handleChange = (e) => {
        this.setState({
            inputRegex: e.target.value
        })
    }

    handleSubmit = (e) => {
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
                <h3>Customize Tokenization</h3>
                <div style={{padding: "0 10px"}}>
                    <input onChange={this.handleChange} id="regex" value={this.state.inputRegex} />
                    <button 
                        type="submit" 
                        id="submitRegex" 
                        className="darkButton"
                        onClick={this.handleSubmit}
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