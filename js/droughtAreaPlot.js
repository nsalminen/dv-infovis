function DroughtAreaPlot() {
    let self = this;

    function initPlot() {
        self.x = d3.scaleTime();
        self.y = d3.scaleLinear().domain([0, 100]);

        initBasisPlot(self, '#graphDroughtArea', 'Date', 'Percentage of land');
        setPlotSizeValues(self);

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

        self.keys = ["None", "D0", "D1", "D2", "D3", "D4"];
        self.colors = d3.scaleOrdinal(d3.schemeCategory10).domain(self.keys).range(
    /*    [
        '#4daf4a',
        '#377eb8',
        '#984ea3',
        '#ffff33',
        '#ff7f00',
        '#e41a1c']
        */

        [
        '#ccebc5',
        '#b3cde3',
        '#decbe4',
        '#ffffcc',
        '#fed9a6',
        '#fbb4ae',]


    );


        self.stack = d3.stack().keys(self.keys)
            .order(d3.stackOrderReverse)
            .offset(d3.stackOffsetNone);

        self.yAxis
            .call(d3.axisLeft(self.y)
                .tickFormat(d => d+'%'));

        self.legend = self.graph.selectAll(".legend")
            .data(self.colors.domain()).enter()
            .append("g")
            .attr("class","legend")
            .attr("transform", "translate(" + (self.width +70 ) + "," + (self.margin.top+10)+ ")");

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

        redraw();
    }

    function redraw(duration) {
        if (duration === undefined)
            duration = 0;
        setPlotSizeValues(self);
        self.yAxis
            .call(d3.axisLeft(self.y)
                .tickFormat(d => d+'%'));
        self.graph.selectAll(".legend").data(self.colors.domain()).attr("transform", "translate(" + (self.width +70 ) + "," + (self.margin.top+10)+ ")");

        if ( self.series !== undefined) {

            self.plot.selectAll('.droughtArea').data(self.series)
                .transition()
                .duration(duration)
                .attr("d", self.area)
                .style("fill", function (d, i) {
                    return self.colors(i);
                });
        }
    }

    function plotDrought(plotData) {
        self.x.domain(d3.extent(plotData, function (d) {
            return d.date;
        }));
        self.series = self.stack(plotData);
        self.plot.selectAll('.droughtArea').data(self.series).exit().remove();
        self.plot.selectAll('.droughtArea').data(self.series).enter()
            .append("path").attr("class", "droughtArea");
        redraw(500);
    }

    return {
        initPlot, plotDrought, redraw
    };
}