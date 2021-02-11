import React, { Component } from 'react'; 

class PlotChooser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            plot: this.props.plots[0],
            metaField: this.props.metaFields[0],
            catagory: this.props.metaValues(this.props.metaFields[0])[0],
        }
    }
    
    optionStyle = {padding:"6px"}

    render() {
        return (
            <div>
                <form id = {"plot-options"}>
                    <div style={this.optionStyle}>
                        {this.plotOptions}
                        {this.metaOptions}
                    </div>
                    {this.catagoryOptions}
                </form>
            </div>
        )
    }

    get plotOptions() {
        return(
            <>
                <label for="plotChooser">Choose a plot:</label>
                <select name="plotChooser" onChange={(event) => this.handlePlotChange(event)}>
                    {this.props.plots.map((plot => {
                        return <option key = {plot.name} value = {plot.name}>
                            {plot.name}
                        </option>
                    }))}
                </select>
            </>
        )
    }

    get catagoryOptions() {
        if(this.state.plot!=="Topic Bar Plot") return null;
        return (
            <div style={this.optionStyle}>
                <label for="categoryChooser">Choose a category:</label>
                <select name="categoryChooser" onChange={(event) => this.handleCatagoryChange(event) } id = "categorySelect">
                    {this.props.metaValues(this.state.metaField).map((catagory => {
                        return <option key = {catagory} value = {catagory}>
                            {catagory}
                        </option>
                    }))}
                </select>
            </div>
        )
    }

    get metaOptions() {
        return(
            <>
                <label for="metaChooser">{" Choose a metadata field:"}</label>
                <select name="metaChooser" onChange={(event) => this.handleMetaChange(event)} >
                    {this.props.metaFields.map(field => {
                        return <option key={field} value={field}>
                            {field}
                        </option>
                    })}
                </select>
            </>
        )
    }

    handlePlotChange = (event) => {
        event.preventDefault();
        let newPlot = event.target.value
        this.setState({
            plot: newPlot,
        })
        this.props.changePlot(newPlot,this.state.metaField,this.state.catagory)
    }

    handleMetaChange = (event) => {
        event.preventDefault();
        let newMetaField = event.target.value
        let newCatagory = this.props.metaValues(event.target.value)[0]
        this.setState({
            metaField:newMetaField,
            catagory: newCatagory,
        })
        this.props.changePlot(this.state.plot,newMetaField,newCatagory);
    }

    handleCatagoryChange = (event) => {
        event.preventDefault();
        let newCatagory = event.target.value
        this.setState({
            catagory:newCatagory
        })
        this.props.changePlot(this.state.plot,this.state.metaField,newCatagory)
    }
}
export default PlotChooser