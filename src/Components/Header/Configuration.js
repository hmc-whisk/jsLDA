import React, { Component } from 'react'; 

class Configuration extends Component {
    constructor(props) {
      super(props);
      this.state = {
        hover: false,
        width: window.innerWidth,
        height: window.innerHeight,
        display: false
      };

      

    }
    
    componentDidMount() {
      window.addEventListener("resize", this.updateDimensions);
    }
    updateDimensions = () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight })
      console.log(this.state.width, this.state.height)
    }

    get overlayStyle() { 
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
      // if (document.getElementById("overlay")) {
      // document.getElementById("overlay").style.display = "block";}
      this.setState({
        display: true
      })
    }
  
    overlayOff = () => {

      this.setState({
        display: false
      });
    }

    toggleHover = () => {
      this.setState({hover: !this.state.hover})
    }

    render() {

      return (
        <div style={{float: "right", }}> 
        <button type="button" onClick={this.overlayOn}  class = "configButton" onMouseEnter={this.toggleHover} onMouseLeave={this.toggleHover}>Configure...</button>
        <div id="overlay" style= {this.overlayStyle} onClick={this.overlayOff}>
          <div onClick={(e) => {
            //stop clicks getting to the overlay
            e.stopPropagation();
            }}>
          {this.props.displayElement}
          </div>
        </div>
        <div style={{padding:'2px'}}>
        </div>
      </div>
      )
    }
}

Configuration.defaultProps = {
  floatRight: true,
}

export default Configuration;