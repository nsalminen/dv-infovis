function FireCauseBarChart() {
    let self = this;

    let plotData = [
        {code: 9.0,  cause: 'Miscellaneous', count: 0},
        {code: 1.0,  cause: 'Lightning', count: 0},
        {code: 5.0,  cause: 'Debris Burning', count: 0},
        {code: 4.0,  cause: 'Campfire', count: 0},
        {code: 2.0,  cause: 'Equipment Use', count: 0},
        {code: 7.0,  cause: 'Arson', count: 0},
        {code: 8.0,  cause: 'Children', count: 0},
        {code: 6.0,  cause: 'Railroad', count: 0},
        {code: 3.0,  cause: 'Smoking', count: 0},
        {code: 11.0, cause: 'Powerline', count: 0},
        {code: 12.0, cause: 'Structure', count: 0},
        {code: 10.0, cause: 'Fireworks', count: 0},
        {code: 13.0, cause: 'Undefined', count: 0}
    ];

    function initPlot() {
        self.x = d3.scaleBand().padding(0.1).domain(plotData.map(x=>x.cause));
        self.y = d3.scaleLinear().domain([0,10]);

        initBasisPlot(self, '#graphFiresCauseBarChart', 'Causes', 'Number of fires');
        setPlotSizeValues(self);
        redraw();
    }

    function redraw(duration) {
        if (duration === undefined)
            duration = 0;
        setPlotSizeValues(self);
        // draw data
        if (plotData !== undefined) {
            self.plot.selectAll("rect")
                .data(plotData)
                .transition()
                .duration(duration)
                .attr("fill", "#a6cee3")
                .attr("x", function (d) {
                    return self.x(d.cause)
                })
                .attr("width", self.x.bandwidth())
                .attr("y", function (d) {
                    return self.y(d.count);
                })
                .attr("height", function (d) {
                    return self.height - self.y(d.count)
                });
        }
    }

    function plot(rawPlotData) {
        plotData.forEach(x => x.count = 0);
        for (let i = 0; i <plotData.length; i++) {
            let index = plotData[i].code;
            if (rawPlotData[index] !== undefined) {
                plotData[i].count += rawPlotData[index];
                rawPlotData[index] = 0;
            }
        }
        let missing = rawPlotData.reduce((acc, x) => {
            return  x+  acc}, 0
        );
        let missingIndex = plotData.findIndex(x=>x.code == 13);
        plotData[missingIndex].count += missing;

        self.x.domain(plotData.map(function(d) {
            return d.cause; }));

        self.y = self.y.domain([0,d3.max(plotData, d=>d.count)]);
        self.plot.selectAll('rect').data(plotData).exit().remove();
        self.plot.selectAll('rect').data(plotData).enter().append("rect");

        redraw(500);
    }

    return {
        initPlot, plot, redraw
    }
}