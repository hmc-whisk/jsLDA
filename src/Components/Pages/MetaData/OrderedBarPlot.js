import BarPlot from './BarPlot'

class OrderedBarPlot extends BarPlot {
    get data() {
        let data = this.props.data.sort((a, b) => a.label.localeCompare(
            b.label,
            undefined,
            {numeric: true})
        )

        return data
    }
}

export default OrderedBarPlot;
