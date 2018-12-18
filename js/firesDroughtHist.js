function FireDroughtPlot() {
    let self = this;

    function initPlot() {
        innerHeight = $( ".plot-container" ).innerHeight();
        innerWidth = $( ".plot-container" ).innerWidth();
        let margin = {top: 10, right: 110, bottom: 50, left: 50};
        let width = innerWidth - margin.left - margin.right;
        self.height = innerHeight - margin.top - margin.bottom;
        self.graph = d3.select('#graphFireDroughtHist').append("svg").attr("class", "plot");;
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

        //labels
        self.graph.append("text")
            .attr("transform",
                "translate(" + ((width/2) +  margin.left)+ " ," +
                (self.height + margin.top + 40) + ")")
            .style("text-anchor", "middle")
            .text("Drought severity");

        self.graph.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 )
            .attr("x",0 - (self.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of fires");
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
    };
}