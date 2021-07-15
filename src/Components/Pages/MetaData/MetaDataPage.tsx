import React, { ChangeEvent } from "react";
import { LDAModel } from "core";
import { Bar } from "react-chartjs-2";
import LabeledToggleButton from 'Components/LabeledToggleButton';
import 'Components/Header/header.css';
import './MetaDataPage.css';

interface metaDataProps {
  ldaModel: LDAModel,
  metaFields: string[]
}

interface metaDataState {
  metaField: string,
  numberOfFields: number,
  sortByTop: boolean,
  sortByName: boolean,
  displayConfigPanel: boolean
}

export class MetaDataPage extends React.Component<metaDataProps, metaDataState> {
  constructor(props: metaDataProps) {
    super(props);
    this.state = {
      metaField: this.props.ldaModel.metaFields[0],
      numberOfFields: 10,
      sortByTop: true,
      sortByName: false,
      displayConfigPanel: false
    };
  }

  /*
  * handles a change of the metafield via the selector
  */
  metaFieldChange(e: ChangeEvent<HTMLSelectElement>) {
    this.setState({metaField: e.target.value})
  }

  //handle the change of number of top words
  numChange(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault();

    if (parseInt(event.target.value) > 30) event.target.value = "30";

    this.setState({
        numberOfFields: Math.max(1, parseInt(event.target.value)),
    })
  }

  /*
  * creates a dropdown menu to select the metafield that will be used to render the graph
  */
  createMetaFieldSelector() {
    return (
      <div id="metafileds selector"> Choose metadata field: &nbsp;
      <select onChange={this.metaFieldChange.bind(this)}>
        {this.props.metaFields.map((metaField) => {
          return (
            <option key={metaField} value={metaField}>
              {metaField}
            </option>
          );
        })}
      </select>
      </div>

    );
  }

  /*
  * gets the data to display in the bar graph.
  * displays the average topic value for every metadata value.
  */
  calculateDataToDisplay() {
    // from MetaData.js
    let averages = this.props.ldaModel.metaTopicAverages(
      this.state.metaField,
      this.props.ldaModel.selectedTopic
    );
    let data = [];
    for (let [key, value] of Object.entries(averages)) {
      data.push({ label: key, value: value });
    }

    type metadataPair = [string, number];
    let result: metadataPair[] = data.map(({label, value}) => ([label, value]));
    result = result.sort((a,b) => (b[1] - a[1]));
    console.log(this.state.sortByTop)
    if (!this.state.sortByTop) {
      if (this.state.sortByName)
        return result.slice(-this.state.numberOfFields).sort();
      else
        return result.slice(-this.state.numberOfFields);
    }
    else {
      if (this.state.sortByName)
        return result.slice(0,this.state.numberOfFields).sort();
      else
        return result.slice(0,this.state.numberOfFields);
    }
  }

  createBarChart() {
    // 2D array, contains [label, value] for each metadata value
    let inputData = this.calculateDataToDisplay(); 

    const data = {
      labels: inputData.map((x) => x[0]), // extract the labels from the 2D array
      datasets: [
        {
          label: "Average topic score " + "(Topic " + this.props.ldaModel.selectedTopic + ")",
          data: inputData.map((x) => x[1]), // extract the values from the 2D array
          fill: true,
          backgroundColor: "rgba(75,192,192,0.2)",
          borderColor: "rgba(75,192,192,1)",
        },
      ],
    };

    const options = {
      indexAxis: "y",
      // Elements options apply to all of the options unless overridden in a dataset
      // In this case, we are setting the border of each horizontal bar to be 2px wide
      elements: {
        bar: {
          borderWidth: 2,
        },
      },
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: this.state.sortByTop ? "Highest " + (this.state.numberOfFields || "")+ " average topic scores by " + this.state.metaField +" in topic "+this.props.ldaModel.selectedTopic
                                     : "Lowest " + (this.state.numberOfFields || "") + " average topic scores by " + this.state.metaField+" in topic "+this.props.ldaModel.selectedTopic,
        },
      },
    };

    return (
      <div>
        {/* calculate height based on the amount of data to display somehow? */}
        {/* @ts-ignore */}
        <Bar data={data} options={options} height={150}/>
      </div>
    );
  }

  noTopicSelected() {
    return (
        <div id="pages">
            <div id="meta-page" className="page">
                <h2 id="label" style={{textAlign: "center"}}> Please Select a Topic</h2>
            </div>
        </div>
    )
  }

  toggleSortNumber() {
    this.setState({
        sortByTop: !this.state.sortByTop
    })
    // console.log(this.state.sortByTop)
  }

  toggleSortName() {
    this.setState({
        sortByName: !this.state.sortByName
    })
    // console.log(this.state.sortByName)
  }

  toggleConfigPanel() {
    this.setState({
        displayConfigPanel: !this.state.displayConfigPanel
    })
    console.log("Edit " + this.state.displayConfigPanel)
  }

  configChart(){
    return(
      <div>
        <div
          style={{
            marginBottom:'0.5em',
            marginTop:"5",
            display:"table-row"}} 
          id="configChart">
            {this.createMetaFieldSelector()}
            Number of bars: &nbsp;  
            <input
              onChange={this.numChange.bind(this)}
              placeholder="# bars"
              type="number" id="numberOfBins"
              value={this.state.numberOfFields}
              max="30"
              min="5"
              step="1"
              style={{marginTop:"5", marginBottom:"5"}}
            ></input>
            <div id="buttons">
            <LabeledToggleButton
              id="toggleSortNumber"
              label={"See " + (this.state.numberOfFields || "") + " lowest topic scores"}
              style={{
                borderTopRightRadius: "10px",
                borderBottomRightRadius: "10px",
                borderTopLeftRadius:"10px",
                borderBottomLeftRadius:"10px",
                marginBottom:"5"}}
              checked={!this.state.sortByTop}
              onChange={this.toggleSortNumber.bind(this)}
            /> 
              <LabeledToggleButton
              id="toggleSortName"
              label={"Sort results lexicographically"}
              style={{
                borderTopRightRadius: "10px",
                borderBottomRightRadius: "10px",
                borderTopLeftRadius:"10px",
                borderBottomLeftRadius:"10px"}}
              checked={this.state.sortByName}
              onChange={this.toggleSortName.bind(this)}
            />
            </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.props.ldaModel.selectedTopic === -1) {
      return this.noTopicSelected()
    }

    return (
      <div>
        <div
          className="help"
          style={{ position: "relative", left: 10, paddingBottom: 0 }}
        >
          This plot displays the average topic scores for metadata values
          present in the collection of documents. Since there is often a very
          high number of distinct metadata values, this plot will show up to 30
          of the metadata values with either the highest or lowest average topic
          scores. Nagivate to the button below the chart to configure the plot.
        </div>
        {this.createBarChart()}
        <div
          className="configPanel"
          style={{
            padding: "5 10px",
            display: "inline-grid",
            backgroundColor: "var(--color1)",
            borderRadius: "10px",
            margin: "5px",
          }}
        >
          {/*inline flex, grid */}
          <button
            className="configMenu"
            style={{ float: "left" }}
            onClick={this.toggleConfigPanel.bind(this)}
          >
            Configure plot
          </button>
          {this.state.displayConfigPanel && <div>{this.configChart()}</div>}
        </div>
      </div>
    );
  }
}

export default MetaDataPage;
