import React, { Component } from 'react';
import OrderedBarPlot from './OrderedBarPlot'
import SortedBarPlot from './SortedBarPlot'
import ScatterPlot from './ScatterPlot'
import PlotChooser from './PlotChooser'
import { topNWords, saveFile } from '../../../funcs/utilityFunctions'



class MetaData extends Component {

    constructor(props) {
        super(props);
        this.state = {
            plot: this.plots[0],
            metaField: this.props.metaFields[0],
            catagory: null
        }
    }

    render() {
        return (
            <div id="meta-page" style={{ marginTop: "2%" }}>
                <PlotChooser
                    plots={this.plots}
                    metaFields={this.props.metaFields}
                    changePlot={this.changePlot}
                    metaValues={this.props.metaValues}
                />
                {this.plot}
            </div>
        )
    }

    get plot() {
        if (!this.state.metaField) {
            return <div className="centerNotice"><h3>No Metadata Found</h3></div>
        }
        return this.state.plot.element();
    }

    orderedBarPlot = () => {
        if (this.props.selectedTopic === -1) {
            return <div className="centerNotice"><h3>
                Please select a topic
            </h3></div>
        }

        let averages = this.props.metaTopicAverages(
            this.state.metaField, this.props.selectedTopic);
        let data = []
        for (let [key, value] of Object.entries(averages)) {
            data.push({ "label": key, "value": value })
        }
        return <div>
            <button id="barPlot-dl" onClick={() => this.barPlotValueDownload()}>Download {this.state.metaField} data across all topics.</button>
            <OrderedBarPlot
                data={data}
                yLabel={"Average Topic " + this.props.selectedTopic + " Value"}
                title={"Average Topic " + this.props.selectedTopic +
                    " Value per " + this.state.metaField}
            />
        </div>
    }

    sortedBarPlot = () => {

        if (this.props.selectedTopic === -1) {
            return <div className="centerNotice"><h3>
                Please select a topic
            </h3></div>
        }

        let averages = this.props.metaTopicAverages(
            this.state.metaField, this.props.selectedTopic);
        let data = []
        for (let [key, value] of Object.entries(averages)) {
            data.push({ "label": key, "value": value })
        }
        return <div>
            <button id="barPlot-dl" onClick={() => this.barPlotValueDownload()}>Download {this.state.metaField} data across all topics.</button>
            <SortedBarPlot
                data={data}
                yLabel={"Average Topic " + this.props.selectedTopic + " Value"}
                title={"Average Topic " + this.props.selectedTopic +
                    " Value per " + this.state.metaField}
            />
        </div>
    }

    barPlotValueDownload = () => {

        // First gather all the data for current md field.
        let all_data = []
        for (let i = 0; i < this.props.numTopics; i++) {
            let averages = this.props.metaTopicAverages(
                this.state.metaField, i);
            let data = []
            for (let [key, value] of Object.entries(averages)) {
                data.push({ "label": key, "value": value })


            }
            all_data.push(data)
        }


        // add heading to csv
        var barPlotCSV = "";
        barPlotCSV += this.state.metaField;
        for (let i = 0; i < this.props.numTopics; i++) {
            barPlotCSV += ", topic " + i;
        }
        barPlotCSV += "\n"

        // fill in data, by key
        for (let j = 0; j < all_data[0].length; j++) {
            barPlotCSV += all_data[0][j]["label"];
            for (let i = 0; i < this.props.numTopics; i++) {
                barPlotCSV += ", " + all_data[i][j]["value"];

            }
            barPlotCSV += "\n"
        }

        // d3.select("#barPlot-dl").attr("href", this.toURL(barPlotCSV, "text/csv"));
        var fileName = this.state.metaField + ".csv";
        let fileType = "text/csv";
        saveFile(fileName,barPlotCSV,fileType);

    }

    topicBarPlot = () => {
        // Protec
        if (this.props.catagory === null) {
            return <div><h3>
                Please select a catagory
            </h3></div>
        }

        // Get/format data
        let averages = this.props.topicAvgsForCatagory(
            this.state.metaField, this.state.catagory);

        let data = []
        for (let [topic, value] of Object.entries(averages)) {
            let topicLabel = "[" + topic + "] " + topNWords(
                this.props.topicWordCounts[topic], 3);
            data.push({ "label": topicLabel, "value": value })
        }
        // Attac (return plot)
        return <div>
            <button id="barPlot-dl" onClick={() => this.topicBarDownload(data)}>Download {this.state.metaField} Topic Values across all categories.</button>
            <SortedBarPlot
                data={data}
                yLabel={"Average Topic Value"}
                title={"Average Topic Values for Documents with " +
                    this.state.catagory + " " + this.state.metaField}
            />
        </div>
    }

    topicBarDownload = (data) => {

        // get the list of categories without needing to parse entire form again
        var sel = document.getElementById("categorySelect").options;
        var categories = []
        for(let i = 0; i < sel.length; i++) {
            categories.push(sel[i].text);
        }

        var barPlotCSV = "";
        barPlotCSV += "Topic Number";
        for (let i = 0; i < categories.length; i++) {
            barPlotCSV += ", " + categories[i];
        }
        barPlotCSV += "\n"

        // First gather all the data for current md field.
        let all_data = []
        for (let i = 0; i < categories.length; i++) {
            let averages = this.props.topicAvgsForCatagory(
                this.state.metaField, categories[i]);
    
            let data = []
            for (let [topic, value] of Object.entries(averages)) {
                let topicLabel = "[" + topic + "] " + topNWords(
                    this.props.topicWordCounts[topic], 3);
                data.push({ "label": topicLabel, "value": value })
            }
            all_data.push(data)
        }
        console.log(all_data)

        // fill in data, by key
        for (let j = 0; j < this.props.numTopics; j++) {
            barPlotCSV += all_data[0][j]["label"];
            for (let i = 0; i < categories.length; i++) {
                barPlotCSV += ", " + all_data[i][j]["value"];

            }
            barPlotCSV += "\n"
        }
        var fileName = "barPlot.csv"
        let fileType = "text/csv";
        saveFile(fileName,barPlotCSV,fileType);
    }

    scatterPlot = () => {
        if (this.props.selectedTopic === -1) {
            return <div className="centerNotice"><h3>
                Please select a topic
            </h3></div>
        }
        let data = this.props
            .docTopicMetaValues(this.state.metaField, this.props.selectedTopic)
            .map((doc) => {
                return {
                    y: doc.topicVal,
                    x: Number(doc.metaVal),
                    label: doc.label
                }
            })
        return <ScatterPlot
            title={"Topic Document Values over " + this.state.metaField}
            data={data}
            xLabel={this.state.metaField}
            yLabel={"Topic Document Value"} />
    }



    plots = ((_this) => [
        {
            element: _this.sortedBarPlot,
            name: "Bar Plot [Order By Value]",
        },
        {
            element: _this.orderedBarPlot,
            name: "Bar Plot [Order By Label]",
        },
        {
            element: _this.topicBarPlot,
            name: "Topic Bar Plot",
        },
        {
            element: _this.scatterPlot,
            name: "Scatter Plot",
        }
    ])(this)

    /**
     * @summary Changes the plot to match params
     * @param {String} plotName name of plot to use
     * @param {String} field name of metafield to use
     */
    changePlot = (plotName, field, catagory) => {
        // Get plot object from plot name
        let plot = this.plots.reduce((plot, thisPlot) => {
            if (thisPlot.name === plotName) {
                plot = thisPlot;
            }
            return plot
        }, this.plots[0]);
        this.setState({
            plot: plot,
            metaField: field,
            catagory: catagory,
        }
        )

    }

    toURL(s, type) {
        // Chrome will not process data URIs larger than 2M
        if (s.length < 1500000) {
            return "data:Content-type:" + type + ";charset=UTF-8," + encodeURIComponent(s);
        }
        else {
            var blob = new Blob([s], { type: type });
            return window.URL.createObjectURL(blob);
        }
    }
}

export default MetaData;