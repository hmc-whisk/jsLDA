import React, { Component } from 'react'; 

class PlotChooser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            plot: this.props.plots[0],
            metaField: this.props.metaFields[0],
            catagory: null,
        }
    }

    render() {
        return (
            <div>
                <form id = {"plot-options"} onSubmit={(event) => 
                        this.handleSubmit(event)
                    }>
                    <label for="plotChooser">Choose a plot:</label>
                    <select name="plotChooser" onChange={(event) => this.handlePlotChange(event)}>
                        {this.props.plots.map((plot => {
                            return <option key = {plot.name} value = {plot.name}>
                                {plot.name}
                            </option>
                        }))}
                    </select>

                    <label for="metaChooser">{" Choose a metadata field:"}</label>
                    <select name="metaChooser" onChange={(event) => this.handleMetaChange(event)}>
                        {this.props.metaFields.map(field => {
                            return <option key={field} value={field}>
                                {field}
                            </option>
                        })}
                    </select>
                    {this.catagoryOptions}
                    <input type="submit" value="Render Plot"/>
                </form>
            </div>
        )
    }

    get catagoryOptions() {
        console.log(this.state.plot)
        if(this.state.plot!=="Topic Bar Plot") return null;
        return (
            <div>
                <label for="catagoryChooser">Choose a catagory:</label>
                <select name="catagoryChooser" onChange={(event) => this.handleCatagoryChange(event)}>
                    {this.props.metaValues(this.state.metaField).map((catagory => {
                        return <option key = {catagory} value = {catagory}>
                            {catagory}
                        </option>
                    }))}
                </select>
            </div>
        )
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.props.changePlot(
            this.state.plot,this.state.metaField,this.state.catagory
        )
    }

    handlePlotChange = (event) => {
        event.preventDefault();
        this.setState({
            plot: event.target.value
        })

    }

    handleMetaChange = (event) => {
        event.preventDefault();
        this.setState({
            metaField:event.target.value
        })

    }

    handleCatagoryChange = (event) => {
        event.preventDefault();
        this.setState({
            catagory:event.target.value
        })

    }
}
export default PlotChooser