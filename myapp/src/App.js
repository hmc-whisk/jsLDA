import React from 'react';
import './App.css';
import Form from "./paramForm"
import SideBar from "./sidebar"
import Nav from "./navButtons"
import TopicDoc from "./docpage"
import Correlation from "./corpage"
import VocabTable from "./vocabpage"
import DLPage from "./dlpage"
import TimeSeries from "./timepage"


class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = { iter: 0, numTopics: 25, selectedTab: "docs-tab" };
    this.updateIter = this.updateIter.bind(this);
    this.updateNumTopics = this.updateNumTopics.bind(this);
    this.changeTab = this.changeTab.bind(this);

  };

  updateIter() {
    this.setState({
      iter: this.state.iter + 1
    });
  }

  updateNumTopics(val) {
    this.setState({
      numTopics: val
    });
  }

  changeTab(tabID) {
    this.setState({
      selectedTab: tabID
    });

    console.log("Tab   is now: " + tabID)
  }


  render() {
    var DisplayPage;
    switch (this.state.selectedTab) {
      case "docs-tab":
        DisplayPage = <TopicDoc />;
        break;
      case "corr-tab":
        DisplayPage = <Correlation />;
        break;
      case "vocab-tab":
        DisplayPage = <VocabTable />;
        break;
      case "ts-tab":
        DisplayPage = <TimeSeries />;
        break;
      case "dl-tab":
        DisplayPage = <DLPage />;
        break;
      default:
        DisplayPage = null;
        break;
    }

    return (
      <div className="App">
        <Form iter={this.state.iter} numTopics={this.state.numTopics} onClick={this.updateIter} onChange={this.updateNumTopics} />
        <SideBar />
        <div id="tabwrapper">

          <Nav onClick={this.changeTab} />
          {DisplayPage}
        </div>
      </div>
    );
  }
}



export default App;
