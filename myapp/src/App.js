import React from 'react';
import './App.css';
import Form from "./comps/paramForm"
import Sidebar from "./comps/sidebar/sidebar"
import Page from "./comps/page/page"

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = { iter: 0, numTopics: 25 };

    this.updateIter = this.updateIter.bind(this);
    this.updateNumTopics = this.updateNumTopics.bind(this);

  };

  updateIter() {
    this.setState({
      iter: this.state.iter + 1
    });
    console.log("Clicked");
  }

  updateNumTopics(val) {
    this.setState({
      numTopics: val
    });
    console.log("Topics: " + this.state.numTopics);
  }

  render() {

    return (
      <div className="App">
        <Form iter={this.state.iter} numTopics = {this.state.numTopics} onClick={this.updateIter} onChange = {this.updateNumTopics}/>
        <Sidebar />
        <Page />
      </div>
    );
  }
}



export default App;
