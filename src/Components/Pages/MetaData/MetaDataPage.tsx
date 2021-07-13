import React, { ChangeEvent } from "react";
import { LDAModel } from "core";
import { Bar } from "react-chartjs-2";

interface metaDataProps {
  ldaModel: LDAModel,
  metaFields: string[]
}

interface metaDataState {
  metaField: string
}

export class MetaDataPage extends React.Component<metaDataProps, metaDataState> {
  constructor(props: metaDataProps) {
    super(props);
    this.state = {
      metaField: this.props.ldaModel.metaFields[0]
    };
  }

  /*
  * handles a change of the metafield via the selector
  */
  metaFieldChange(e: ChangeEvent<HTMLSelectElement>) {
    this.setState({metaField: e.target.value})
  }

  /*
  * creates a dropdown menu to select the metafield that will be used to render the graph
  */
  createMetaFieldSelector() {
    return (
      <select onChange={this.metaFieldChange.bind(this)}>
        {this.props.metaFields.map((metaField) => {
          return (
            <option key={metaField} value={metaField}>
              {metaField}
            </option>
          );
        })}
      </select>
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

    let result = data.map(({label, value}) => ([label, value]));
    // console.log(data);
    console.log(result);
    return result;
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
          position: "right",
        },
        title: {
          display: true,
          text: "Average topic score by " + this.state.metaField,
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

  render() {
    if (this.props.ldaModel.selectedTopic === -1) {
      return this.noTopicSelected()
    }

    return <div className="page">{this.createBarChart()} {this.createMetaFieldSelector()}</div>;
  }
}

export default MetaDataPage;
