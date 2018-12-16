function droughtAreaPlot() {
    let self = this;

    function initPlot() {
        let margin = {top: 20, right: 100, bottom: 30, left: 50};
        let width = 960 - margin.left - margin.right;
        let height = 500 - margin.top - margin.bottom;

        self.x = d3.scaleTime().range([0, width]);
        self.y = d3.scaleLinear().range([height, 0]).domain([0, 100]);

        self.area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(function (d) {
                return self.x(d.data.date);
            })
            .y0(function (d) {
                return self.y(d[0]);
            })
            .y1(function (d) {
                return self.y(d[1]);
            });

        self.keys = ["None", "D0", "D1", "D2", "D3", "D4"]

        self.colors = d3.scaleOrdinal(d3.schemeCategory10).domain(self.keys);

        self.stack = d3.stack().keys(self.keys)
            .order(d3.stackOrderReverse)
            .offset(d3.stackOffsetNone)


        self.plot = graph
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // add the X Axis
        self.xAxis = self.plot.append("g")
            .attr("transform", "translate(0," + height + ")");
        self.xAxis
            .call(d3.axisBottom(self.x));

        // add the Y Axis
        self.plot.append("g")
            .call(d3.axisLeft(self.y));

        self.legend = graph.selectAll(".legend")
            .data(self.colors.domain()).enter()
            .append("g")
            .attr("class","legend")
            .attr("transform", "translate(" + (width +70 ) + "," + (margin.top+10)+ ")");

        self.legend.append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) { return 20 * i; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d, i) {
                return self.colors(i);});

        self.legend.append("text")
            .attr("x", 20)
            .attr("dy", "0.75em")
            .attr("y", function(d, i) { return 20 * i; })
            .text(function(d) {return d});
    }

    function plotDrought(plotData) {
        self.x.domain(d3.extent(plotData, function (d) {
            return d.date;
        }));
        self.xAxis
            .call(d3.axisBottom(self.x));
        let series = self.stack(plotData);

        self.plot.selectAll('.droughtArea').data(series).exit().remove();
        self.plot.selectAll('.droughtArea').data(series).enter()
            .append("path").attr("class", "droughtArea");
        self.plot.selectAll('.droughtArea').data(series)
            .transition()
            .duration(500)
            .attr("d", self.area)
            .style("fill", function (d, i) {
                return self.colors(i);
            });

    }
    return {
        initPlot, plotDrought
    }
}