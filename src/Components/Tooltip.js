import React, { Component } from 'react'; 

class Tooltip extends Component {
    constructor(props) {
      super(props);
      this.state = {
        hover: false,
        width: window.innerWidth,
        height: window.innerHeight
      };

      

    }
    
    componentDidMount() {
      window.addEventListener("resize", this.updateDimensions);
    }
    updateDimensions = () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight })
      console.log(this.state.width, this.state.height)
    }

    overlayStyle = {
    position: 'fixed',
      display: 'none',
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

    textstyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: '50px',
    color: 'white',
    transform: 'translate(-50%,-50%)',
    msTransform: 'translate(-50%,-50%)',
    }

    overlayOn = () => {
      if (document.getElementById("overlay")) {
      document.getElementById("overlay").style.display = "block";}
    }
  
    overlayOff = () => {
      if (document.getElementById("overlay")) {
      document.getElementById("overlay").style.display = "none";}
    }

    toggleHover = () => {
      this.setState({hover: !this.state.hover})
    }

    render() {
      let buttonstyle = {}
      if (this.state.hover) {
        buttonstyle = {
        border: 'solid #ddd 2px',
        margin:'0 2px 0 0',
        padding:'7px 10px',
        display:'block',
        float:'right',
        fontSize : '1em',
        color:'#333',
        WebkitUserSelect:'none',
        MozUserSelect:'none',
        userSelect: 'none',
        MozBorderRadius: '4px',
        borderRadius: '4px',
        background: '#ddd',
        cursor:'pointer'}
      }
      else {
        buttonstyle = {
        border: 'solid #ddd 2px',
        margin:'0 2px 0 0',
        padding:'7px 10px',
        display:'block',
        float: 'right',
        fontSize : '1em',
        color:'#333',
        WebkitUserSelect:'none',
        MozUserSelect:'none',
        userSelect: 'none',
        MozBorderRadius: '4px',
        borderRadius: '4px',
        background: '#FFFFFF',
        cursor:'auto'
      }
    }

      return (
        <div > 
        <div id="overlay" style= {this.overlayStyle} onClick={this.overlayOff}>
        <div id="text" style= {this.textstyle}> 
        <img src= {this.props.tooltip} className="media-object"
          alt={this.props.altText} height = {'auto'} width = {this.state.width*0.8}
          draggable= 'false'/></div>
        </div>

        <div style={{padding:'2px'}}>
        <button onClick={this.overlayOn} style= {buttonstyle} onMouseEnter={this.toggleHover} onMouseLeave={this.toggleHover}>Help</button>
        </div>
      </div>
      )
    }
}

export default Tooltip;