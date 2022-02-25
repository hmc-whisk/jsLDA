import React, { ChangeEvent, SyntheticEvent } from "react";
import { LDAModel } from "core";
import { Bar } from "react-chartjs-2";
import LabeledToggleButton from 'Components/LabeledToggleButton';
import 'Components/Header/header.css';
// import './MetaDataPage.css';

interface metaDataProps {
  ldaModel: LDAModel,
  metaFields: string[],
}

interface metaDataState {
  metaField: string,
  numberOfFields: number,
  numberOfFieldsGeneral:number,
  sortByTop: boolean,
  sortByName: boolean,
  displayConfigPanel: boolean,
  topicSets: number[],
  choosedTopic: number,
  add: boolean
}

export class MetaDataPage extends React.Component<metaDataProps, metaDataState> {
  constructor(props: metaDataProps) {
    super(props);
    this.state = {
      metaField: this.props.ldaModel.metaFields[0],
      numberOfFields: 10,
      numberOfFieldsGeneral: 5,
      sortByTop: true,
      sortByName: false,
      displayConfigPanel: false,
      topicSets: [0,1,2],
      choosedTopic: 0,
      add: true
    };
  }

  /*
  * handles a change of the metafield via the selector
  */
  metaFieldChange(e: ChangeEvent<HTMLSelectElement>) {
    this.setState({metaField: e.target.value})
  }

  plotActionChange(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "Add") {
      this.setState({add: true})
    } else {
      this.setState({add: false})
    }
    console.log(this.state.add)
  }

  //handle the change of number of top words
  fieldsNumChange(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    if (this.props.ldaModel.selectedTopic === -1) {
      if (parseInt(event.target.value) >= 10)
      event.target.value = "10";
      this.setState({
          numberOfFieldsGeneral: Math.max(1, parseInt(event.target.value)),
      })
    } else {
      if (parseInt(event.target.value) > 30)
      event.target.value = "30";
      this.setState({
          numberOfFields: Math.max(1, parseInt(event.target.value)),
      })
    }
  }

  topicNumChange(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault();

    this.setState({
      choosedTopic : parseInt(event.target.value)
    });

    console.log(this.state.choosedTopic)
  }

  numChange(e:SyntheticEvent<HTMLInputElement>){
    if (!(e.target as HTMLInputElement).value || parseInt((e.target as HTMLInputElement).value) <=0) {
      this.setState(state => {
        const topicSets = state.topicSets.concat(parseInt((e.target as HTMLInputElement).value));
        console.log(topicSets)
        return {
          topicSets
        };
      });
    }
    console.log(this.state.topicSets)
  }

    handleSubmit(e: SyntheticEvent) {
        if (this.state.choosedTopic>=0 && this.state.choosedTopic<this.props.ldaModel.numTopics && Number.isInteger(this.state.choosedTopic)){
            if (this.state.add && !this.state.topicSets.includes(this.state.choosedTopic)) {
                this.setState(state => {
                    const topicSets = state.topicSets.concat(this.state.choosedTopic).sort();
                    return {
                        topicSets
                    };
                });
            } else if (!this.state.add) {
                this.setState(prevState => (
                    {
                        topicSets: prevState.topicSets.filter(topic => topic !== this.state.choosedTopic)
                    }
                ));
            }
        }
    }

  /*
  * creates a dropdown menu to select the metafield that will be used to render the graph
  */
  createMetaFieldSelector() {
    return (
      <div id="metafileds selector"> Choose metadata fields:&nbsp;
      <select
        onChange={this.metaFieldChange.bind(this)
      }>
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
  calculateDataToDisplay(topic:number, numFields:number) {
    // from MetaData.js
    let averages = this.props.ldaModel.metaTopicAverages(
      this.state.metaField,
      topic
    );
    let data = [];
    for (let [key, value] of Object.entries(averages)) {
      if (key.length > 20){
        key = key.slice(0,20)+ "..."
      }
      data.push({ label: key, value: value });
    }

    type metadataPair = [string, number];
    let result: metadataPair[] = (
      data.map(({label, value}) => ([label, value]))
    );
    result = result.sort((a,b) => (b[1] - a[1]));
    if (!this.state.sortByTop) {
      if (this.state.sortByName)
        return result.slice(-numFields).sort();
      else
        return result.slice(-numFields);
    }
    else {
      if (this.state.sortByName)
        return result.slice(0,numFields).sort();
      else
        return result.slice(0,numFields);
    }
  }

  createBarChart(inputData:any[]) {
    // 2D array, contains [label, value] for each metadata value
    const data = {
      labels: inputData.map((x) => x[0]), // extract the labels from the 2D array
      datasets: [
        {
          label: "Topic " + this.props.ldaModel.selectedTopic,
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
      redraw:true,

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

  // create svg when no topic is selected
  createBarChartGeneral(topicSets:number[]) {
    let inputDataSample = this.calculateDataToDisplay(topicSets[0], this.state.numberOfFieldsGeneral);

    let data : {
      labels: any[];
      datasets: {
          label: string;
          data: number[];
          fill: boolean;
          backgroundColor: string;
          borderColor: string;
      }[];
    }

    data = {
      labels: inputDataSample.map((x) => x[0]), // extract the labels from the 2D array
      datasets: [
        {
          label: "Topic " + this.props.ldaModel.selectedTopic,
          data: inputDataSample.map((x) => x[1]), // extract the values from the 2D array
          fill: true,
          backgroundColor: "",
          borderColor: "",
        },
      ],
    };

    data.datasets.pop();

    for (let topic = 0; topic < topicSets.length; topic++) {
      let inputData = this.calculateDataToDisplay(topicSets[topic], this.state.numberOfFieldsGeneral)

      // looking for a better way to randomize different colors for each topic
      const randomColor = Math.floor(topic*16777215/3000).toString(16);

      data.datasets.push(
        {
          label: "Topic " + topicSets[topic],
          data: inputData.map((x) => x[1]), // extract the values from the 2D array
          fill: true,
          backgroundColor: "#"+randomColor.toString(),
          borderColor: "#b3b8ba",
        }
      )
    }

    const options = {
      indexAxis: 'y',
      elements: {
        bar: {
          borderWidth: 2,
        }
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Average Topic Scores by Metadata'
        }
      }
    }

    return (
      <div>
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
  }

  toggleSortName() {
    this.setState({
        sortByName: !this.state.sortByName
    })
  }

  toggleConfigPanel() {
    this.setState({
        displayConfigPanel: !this.state.displayConfigPanel
    })
    console.log("Edit " + this.state.displayConfigPanel)
  }

  configChart(){
    return(
        <div
          style={{
            display:'flex', justifyContent:'space-between', alignItems:'center'
            }}
          id="configChart">
            {this.createMetaFieldSelector()}
            <div style={{marginLeft:"10"}}>
            Number of fields:&nbsp;
            <input
              onChange={this.fieldsNumChange.bind(this)}
              placeholder="# bars"
              type="number" id="numberOfBins"
              value={this.state.numberOfFields}
              max="30"
              min="1"
              step="1"
            ></input></div>
            <div id="buttons" style={{display:"flex", marginLeft  :"10" }}>
            <LabeledToggleButton
              id="toggleSortNumber"
              label={"See " + (this.state.numberOfFields || "") + " lowest topic scores fields in topic " + (this.props.ldaModel.selectedTopic)}
              style={{
                borderTopRightRadius: "10px",
                borderBottomRightRadius: "10px",
                borderTopLeftRadius:"10px",
                borderBottomLeftRadius:"10px"}}
              checked={!this.state.sortByTop}
              onChange={this.toggleSortNumber.bind(this)}
            />
            <LabeledToggleButton
              id="toggleSortName"
              label={"Sort lexicographically"}
              style={{
                borderTopRightRadius: "10px",
                borderBottomRightRadius: "10px",
                borderTopLeftRadius:"10px",
                borderBottomLeftRadius:"10px",
              marginLeft:"5"}}
              checked={this.state.sortByName}
              onChange={this.toggleSortName.bind(this)}
            />
            </div>
        </div>
    )
  }

  configGeneralChart(){
    return(
      <div
        style={{
          display:'flex', justifyContent:'space-between', alignItems:'center'
          }}
        id="configChart">
        {this.createMetaFieldSelector()}
        <div>
          Number of fields:&nbsp;
          <input
            placeholder="# bars"
            type="number" id="numberOfBins"
            value={this.state.numberOfFieldsGeneral}
            onChange={this.fieldsNumChange.bind(this)}
            max="10"
            min="1"
            step="1"
          ></input>
        </div>
        <div style={{marginLeft:"10"}}>
          <div style={{display: "table", margin: "5px"}}>
            <span id="topic action control">
              <select
                  onChange={this.plotActionChange.bind(this)}>
                      <option value="Add">Add</option>
                      <option value="Remove">Remove</option>
              </select>
              &nbsp;
              Topic:
              &nbsp;
              <input id="topics-input"
                  onChange={this.topicNumChange.bind(this)}
                  type="number"
                  defaultValue={0}
                  placeholder="# bins"
                  max={this.props.ldaModel.numTopics}
                  min="1"
                  step="1"
                  style={{position:"relative", left:0}}
              />
              &nbsp;
              to the chart
              <button
                type="submit"
                id="submitTopNum"
                className="darkButton"
                onClick={this.handleSubmit.bind(this)}
                disabled={this.props.ldaModel.modelIsRunning}
                > Update
                </button>
                &nbsp;
            </span>
          </div>
        </div>
        <div id="buttons" style={{display:"flex", marginLeft:"10", textAlign:"center"}}>
          <LabeledToggleButton
            id="toggleSortNumber"
            label={"See " + (this.state.numberOfFieldsGeneral || "") + " lowest topic scores fields"}
            style={{
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "10px",
              borderTopLeftRadius:"10px",
              borderBottomLeftRadius:"10px"}}
            checked={!this.state.sortByTop}
            onChange={this.toggleSortNumber.bind(this)}
          />
          <LabeledToggleButton
            id="toggleSortName"
            label={"Sort lexicographically"}
            style={{
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "10px",
              borderTopLeftRadius:"10px",
              borderBottomLeftRadius:"10px",
            marginLeft:"5"}}
            checked={this.state.sortByName}
            onChange={this.toggleSortName.bind(this)}
          />
        </div>
      </div>
    )
  }

  render() {
    if (this.props.ldaModel.selectedTopic === -1) {
      return (
        <div style={{marginBottom:"80"}}>
          <hr></hr>
          This plot displays the average topic scores for metadata values
        present cross topics in the collection of documents. Since there is
        often a very high number of distinct metadata values, this plot will
        show up to 10 of the metadata values with either the highest or
        lowest average topic scores. The plot sorts by topic scores by default.
        You can interact with the plot by the options below.
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
          <div>{this.configGeneralChart()}</div>
        </div>
        {this.createBarChartGeneral(this.state.topicSets)}
        </div>
      )
    }

    else {
      return (
        <div>
          <div
            className="help"
            style={{ position: "relative", left: 10, paddingBottom: 0 }}
          >
            <hr></hr>
            This plot displays the average topic scores for metadata values
            present in the current topic you selected. This plot will show up to 30
            of the metadata values with either the highest or lowest average topic
            scores. Nagivate to the options below interact configure the plot.
          </div>

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
            <div>{this.configChart()}</div>
          </div>

          {this.createBarChart(this.calculateDataToDisplay(this.props.ldaModel.selectedTopic, this.state.numberOfFields))}
        </div>
      );
    }
  }
}

export default MetaDataPage;
