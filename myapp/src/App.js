import React from 'react';
import './App.css';
import Form from "./comps/paramForm"
import Sidebar from "./comps/sidebar/sidebar"
import Nav from "./comps/page/navButtons"
import DocsPage from "./comps/page/docsPage"
import CorrPage from "./comps/page/corrPage"
import VocabPage from "./comps/page/vocabPage"
import DLPage from "./comps/page/dlPage"
import TSPage from "./comps/page/tsPage"


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

    console.log("Page is now: " + tabID)
  }


  render() {
    var DisplayPage;
    switch (this.state.selectedTab) {
      case "docs-tab":
        DisplayPage = <DocsPage />;
        break;
      case "corr-tab":
        DisplayPage = <CorrPage />;
        break;
      case "vocab-tab":
        DisplayPage = <VocabPage />;
        break;
      case "ts-tab":
        DisplayPage = <TSPage />;
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
        <Sidebar />
        <div id="tabwrapper">

          <Nav onClick={this.changeTab} />
          {DisplayPage}
        </div>
      </div>
    );
  }
}



export default App;
