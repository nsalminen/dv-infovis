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
        let margin = {top: 10, right: 100, bottom: 50, left: 50};
        innerHeight = $( ".plot-container" ).innerHeight();
        innerWidth = $( ".plot-container" ).innerWidth();
        self.width = innerWidth - margin.left - margin.right;
        self.height = innerHeight - margin.top - margin.bottom;
        self.graph = d3.select('#graphFiresCauseBarChart').append("svg");
        self.x = d3.scaleBand().range([0, self.width]).padding(0.1).domain(plotData.map(x=>x.cause));
        self.y = d3.scaleLinear().range([self.height, 0]).domain([0,10]);

        self.plot = self.graph.attr("width", self.width + margin.left + margin.right)
            .attr("height", self.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        // add the x Axis
        self.xAxis = self.plot.append("g")
            .attr("transform", "translate(0," + self.height + ")");
        self.xAxis.call(d3.axisBottom(self.x));

        self.yAxis = self.plot.append("g");
        self.yAxis.call(d3.axisLeft(self.y));
    }

    function plot(rawPlotData) {
        plotData.forEach(x => x.count = 0);
        for (let i = 0; i <plotData.length; i++) {
            let index = plotData[i].code
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
        self.plot.selectAll("rect")
            .data(plotData)
            .transition()
            .duration(500)
            .attr("fill", "blue")
            .attr("x", function (d) {
                let x = self.x(d.cause);
                return self.x(d.cause)
            })
            .attr("width", self.x.bandwidth())
            .attr("y", function(d) { return self.y(d.count); })
            .attr("height", function(d) {
                let y  = self.height- self.y(d.count)
                return self.height- self.y(d.count)});


        // add the x and y Axis
        self.yAxis.transition().call(d3.axisLeft(self.y));
        self.xAxis.transition().call(d3.axisBottom(self.x));
    }

    return {
        initPlot, plot
    }
}