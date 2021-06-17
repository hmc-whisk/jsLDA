import React, {Component, ReactElement} from 'react';
import './header.css';

interface ConfigurationProps{
    displayElement:ReactElement
}
interface ConfigurationState{
    hover:boolean,
    width:number,
    height:number,
    display:boolean
}

export class Configuration extends Component<ConfigurationProps,ConfigurationState> {
    constructor(props:ConfigurationProps) {
        super(props);
        this.state = {
            hover: false,
            width: window.innerWidth,
            height: window.innerHeight,
            display: false
        };
    }

    componentDidMount() {
        window.addEventListener("resize", this.updateDimensions.bind(this));
    }

    updateDimensions() {
        this.setState({width: window.innerWidth, height: window.innerHeight})
        console.log(this.state.width, this.state.height)
    }

    get overlayStyle(): React.CSSProperties{
        return {
            position: 'fixed',
            display: this.state.display ? 'block' : 'none',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2,
            cursor: 'pointer',
        }
    }

    textstyle:React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        fontSize: '50px',
        color: 'white',
        transform: 'translate(-50%,-50%)',
        msTransform: 'translate(-50%,-50%)',
    }

    overlayOn(){
        // if (document.getElementById("overlay")) {
        // document.getElementById("overlay").style.display = "block";}
        this.setState({
            display: true
        })
    }

    overlayOff(){

        this.setState({
            display: false
        });
    }

    toggleHover() {
        this.setState({hover: !this.state.hover})
    }

    static defaultProps={
        floatRight: true
    }

    render() {
        return (
            <div style={{float: "right",}}>
                <button type="button" onClick={this.overlayOn.bind(this)} className="configButton" onMouseEnter={this.toggleHover.bind(this)}
                        onMouseLeave={this.toggleHover.bind(this)}>Configure...
                </button>
                <div id="overlay" style={this.overlayStyle} onClick={this.overlayOff.bind(this)}>
                    <div onClick={(e) => {
                        //stop clicks getting to the overlay
                        e.stopPropagation();
                    }}>
                        {this.props.displayElement}
                    </div>
                </div>
                <div style={{padding: '2px'}}>
                </div>
            </div>
        )
    }
}

export default Configuration;
