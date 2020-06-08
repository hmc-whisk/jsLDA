import React from 'react';
import './App.css';
import Form from "./comps/paramForm"
import Sidebar from "./comps/sidebar/sidebar"
import Page from "./comps/page/page"

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Form />
        <Sidebar />
        <Page />
      </div>
    );
  }
}



export default App;
