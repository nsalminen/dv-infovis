function setPlotSizeValues(plot) {
    plot.margin = {top: 10, right: 110, bottom: 50, left: 50};

    let innerHeight = $( ".plot-container" ).innerHeight();
    let innerWidth = $( ".plot-container" ).innerWidth();
    plot.width = innerWidth - plot.margin.left - plot.margin.right;
    plot.height = innerHeight - plot.margin.top - plot.margin.bottom;

    plot.graph
        .attr("width", plot.width + plot.margin.left + plot.margin.right)
        .attr("height", plot.height + plot.margin.top + plot.margin.bottom);
    plot.plot.attr("transform",
            "translate(" + plot.margin.left + "," + plot.margin.top + ")");

    plot.x.range([0, plot.width]);
    plot.y.range([plot.height, 0]);
    plot.xAxis.attr("transform", "translate(0," + plot.height + ")")
              .call(d3.axisBottom(plot.x));

    plot.yAxis.call(d3.axisLeft(plot.y));

    plot.xLabel.attr("transform",
        "translate(" + ((plot.width/2) +  plot.margin.left)+ " ," +
        (plot.height + plot.margin.top + 40) + ")");

    plot.yLabel.attr("x",0 - (plot.height / 2))
}

function initBasisPlot(plot, key, xLabel, yLabel) {
    plot.graph = d3.select(key).append("svg").attr("class", "plot");
    plot.plot = plot.graph.append("g");

    plot.xAxis = plot.plot.append("g");
    plot.yAxis = plot.plot.append("g");

    //labels
    plot.xLabel = plot.graph.append("text")
        .style("text-anchor", "middle")
        .text(xLabel);

    plot.yLabel = plot.graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 )
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yLabel);


}