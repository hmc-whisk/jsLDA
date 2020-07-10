import BarPlot from './BarPlot'

class OrderedBarPlot extends BarPlot {
    get data() {
        let data = this.props.data.sort((a,b) => a.label.localeCompare(b.label))

        return data
    }
}

export default OrderedBarPlot;