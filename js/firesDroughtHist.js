function FireDroughtPlot() {
    let self = this;

    function initPlot() {
        let margin = {top: 20, right: 100, bottom: 30, left: 50};
        let width = 960 - margin.left - margin.right;
        self.height = 500 - margin.top - margin.bottom;
        self.graph = d3.select('#graphFireDroughtHist');
        self.x = d3.scaleLinear().range([0, width]).domain([0,1]);
        self.y = d3.scaleLinear().range([self.height, 0]).domain([0,10]);
        self.histogram = d3.histogram()
            .value(function(d) { return d; })
            .domain(self.x.domain())
            .thresholds(20);

        self.plot = self.graph.attr("width", width + margin.left + margin.right)
            .attr("height", self.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        // add the x Axis
        self.plot.append("g")
            .attr("transform", "translate(0," + self.height + ")")
            .call(d3.axisBottom(self.x));
        self.yAxis = self.plot.append("g");
        self.yAxis.call(d3.axisLeft(self.y));
    }

    function plot(plotData) {
        let bins = self.histogram(plotData);
        let gapSize = 2;
        let width = self.x(bins[0].x1) - self.x(bins[0].x0) - 2 * gapSize - 1;

        //TODO maybe (semi-)fixed domain?
        self.y = self.y.domain([0,d3.max(bins, b=>b.length)]);

        self.plot.selectAll('rect').data(bins).exit().remove();
        self.plot.selectAll('rect').data(bins).enter().append("rect");
        self.plot.selectAll("rect")
            .data(bins)
            .transition()
            .duration(500)
            .attr("transform", function(d) {
                return "translate(" + self.x(d.x0) + "," +  self.y(d.length)  + ")"; }) //self.y(d.length)
            .attr("fill", "blue")
            .attr("x", gapSize + 1)
            .attr("width", width)
            .attr("height", function(d) {
                return self.height- self.y(d.length)});


        // add the y Axis
        self.yAxis.transition().call(d3.axisLeft(self.y));
    }

    return {
        initPlot, plot
    }
}