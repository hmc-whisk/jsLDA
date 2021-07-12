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

  metaFieldChange(event: ChangeEvent<HTMLSelectElement>) {
    // event.preventDefault();

    console.log(event.target.value);
    this.setState({metaField: event.target.value})

  }

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

  createBarChart() {
    // hard coded test data
    // console.log(this.props.ldaModel.metaFields);
    const data = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: this.state.metaField,
          data: [33, 53, 85, 41, 44, 65],
          fill: true,
          backgroundColor: "rgba(75,192,192,0.2)",
          borderColor: "rgba(75,192,192,1)",
        },
        {
          label: "Second dataset",
          data: [33, 25, 35, 51, 54, 76],
          fill: false,
          borderColor: "#742774",
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
      plugins: {
        legend: {
          position: "right",
        },
        title: {
          display: true,
          text: "Chart.js Horizontal Bar Chart",
        },
      },
    };

    return (
      <div>
        {/* @ts-ignore */}
        <Bar data={data} options={options} />
      </div>
    );
  }

  render() {
    return <div className="page">{this.createBarChart()} {this.createMetaFieldSelector()}</div>;
  }
}

export default MetaDataPage;
