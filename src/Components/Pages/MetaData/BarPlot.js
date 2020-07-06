import Plot from './Plot'
import { select } from 'd3-selection'

class BarPlot extends Plot {
    proportionLabels = .2

    // Override Plot's functions to render a plot
    createPlot() {
        super.createPlot()
    }


}

export default BarPlot;