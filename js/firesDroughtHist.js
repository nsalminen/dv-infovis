function FireDroughtPlot() {
    let self = this;

    function initPlot() {
        self.x = d3.scaleLinear().domain([0,1]);
        self.y = d3.scaleLinear().domain([0,10]);
        initBasisPlot(self, '#graphFireDroughtHist', 'Drought severity', 'Number of fires');
        setPlotSizeValues(self);


        self.histogram = d3.histogram()
            .value(function(d) { return d; })
            .domain(self.x.domain())
            .thresholds(20);

        redraw();
    }

    function redraw(duration) {
        if (duration === undefined)
            duration = 0;
        setPlotSizeValues(self);
        if(self.bins!==undefined) {
            let gapSize = 2;
            let binWidth = self.x(self.bins[0].x1) - self.x(self.bins[0].x0) - 2 * gapSize - 1;
            self.plot.selectAll("rect")
                .data(self.bins)
                .transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + self.x(d.x0) + "," +  self.y(d.length)  + ")"; }) //self.y(d.length)
                .attr("fill", "blue")
                .attr("x", gapSize + 1)
                .attr("width", binWidth)
                .attr("height", function(d) {
                    return self.height- self.y(d.length)});
        }

    }

    function plot(plotData) {
        self.bins = self.histogram(plotData);
        self.y = self.y.domain([0,d3.max(self.bins, b=>b.length)]);

        self.plot.selectAll('rect').data(self.bins).exit().remove();
        self.plot.selectAll('rect').data(self.bins).enter().append("rect");

        redraw(500);
    }

    return {
        initPlot, plot, redraw
    };
}