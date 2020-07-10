import React, { Component } from 'react'; 
import OrderedBarPlot from './OrderedBarPlot'
import SortedBarPlot from './SortedBarPlot'
import ScatterPlot from './ScatterPlot'
import PlotChooser from './PlotChooser'
import {topNWords} from '../../../funcs/utilityFunctions'


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
        return(
            <div id="meta-page" style={{marginTop:"2%"}}>
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
        if(!this.state.metaField) {
            return <h3>No Metadata Found</h3>
        }
        return this.state.plot.element();
    }

    orderedBarPlot = () => {
        if(this.props.selectedTopic===-1){
            return <div><h3>
                Please select a topic
            </h3></div>
        }

        let averages = this.props.metaTopicAverages(
            this.state.metaField,this.props.selectedTopic);
        let data = []
        for(let [key,value] of Object.entries(averages)){
            data.push({"label":key,"value":value})
        }
        return <OrderedBarPlot
            data={data}
            yLabel={"Average Topic " + this.props.selectedTopic + " Value"}
            title={"Average Topic " + this.props.selectedTopic +
                " Value per " + this.state.metaField}
        />
    }

    sortedBarPlot = () => {
        if(this.props.selectedTopic===-1){
            return <div><h3>
                Please select a topic
            </h3></div>
        }

        let averages = this.props.metaTopicAverages(
            this.state.metaField,this.props.selectedTopic);
        let data = []
        for(let [key,value] of Object.entries(averages)){
            data.push({"label":key,"value":value})
        }
        return <SortedBarPlot
            data={data}
            yLabel={"Average Topic " + this.props.selectedTopic + " Value"}
            title={"Average Topic " + this.props.selectedTopic +
                " Value per " + this.state.metaField}
        />
    }

    topicBarPlot = () => {
        // Protec
        if(this.props.catagory===null){
            return <div><h3>
                Please select a catagory
            </h3></div>
        }

        // Get/format data
        let averages = this.props.topicAvgsForCatagory(
            this.state.metaField,this.state.catagory);

        let data = []
        for(let [topic,value] of Object.entries(averages)){
            let topicLabel = "[" + topic + "] " + topNWords(
                this.props.topicWordCounts[topic],3);
            data.push({"label":topicLabel,"value":value})
        }

        // Attac (return plot)
        return <SortedBarPlot
            data={data}
            yLabel={"Average Topic Value"}
            title={"Average Topic Values for Documents with " +
                this.state.catagory + " " + this.state.metaField}
        />
    }

    scatterPlot = () => {
        if(this.props.selectedTopic===-1){
            return <div><h3>
                Please select a topic
            </h3></div>
        }
        let data = this.props
            .docTopicMetaValues(this.state.metaField,this.props.selectedTopic)
            .map((doc) => { return {
                y: doc.topicVal,
                x: Number(doc.metaVal),
                label: doc.label
            }})
        return <ScatterPlot 
            title={"Topic Document Values over " + this.state.metaField}
            data={data}
            xLabel={this.state.metaField}
            yLabel={"Topic Document Value"}/>
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
            name:"Topic Bar Plot",
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
    changePlot = (plotName,field, catagory) => {
        // Get plot object from plot name
        let plot = this.plots.reduce((plot,thisPlot) => {
            if(thisPlot.name===plotName){
                plot = thisPlot;
            }
            return plot
        },this.plots[0]);
        this.setState({ 
            plot:plot,
            metaField:field,
            catagory:catagory,
        }
    )

    }
}

export default MetaData;