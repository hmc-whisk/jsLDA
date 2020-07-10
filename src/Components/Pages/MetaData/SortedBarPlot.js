import BarPlot from './BarPlot'

class SortedBarPlot extends BarPlot {
    get data() {
        let data = this.props.data.sort((a,b) => b.value - a.value)

        return data
    }
}

export default SortedBarPlot;