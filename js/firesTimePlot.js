
function randomTest() {
	console.log("THIS IS FUCKING WEIRD");
	return 'a';
}

function FireTimePlot() {
	let self = this;

    function initPlot() {
        let margin = {top: 10, right: 110, bottom: 50, left: 50};
        innerHeight = $( ".plot-container" ).innerHeight();
        innerWidth = $( ".plot-container" ).innerWidth();
		let width = innerWidth - margin.left - margin.right;
		console.log("Firetime width: " + width);
		self.height = innerHeight - margin.top - margin.bottom;
		self.graph = d3.select('#graphFiresTimePlot').append("svg").attr("class", "plot");;

		// Range from startdate to enddate
		self.x = d3.scaleTime().range([0, width]);
		self.y = d3.scaleLinear().range([self.height, 0]).domain([0, 100]);

		// @TODO: Update
        self.histogram = d3.histogram()
            .value(function(d) { return d; })
            .domain(self.x.domain())
            .thresholds(10);

		self.plot = self.graph.attr("width", width + margin.left + margin.right)
            .attr("height", self.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // add the x Axis
        self.xAxis = self.plot.append("g")
            .attr("transform", "translate(0," + self.height + ")")
            .call(d3.axisBottom(self.x));
        self.yAxis = self.plot.append("g");
        self.yAxis.call(d3.axisLeft(self.y));

        self.plotLine = self.plot.append("path")
        		.attr("fill", "none")
				.attr("stroke", "steelblue")
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 1.5)
        self.line = d3.line()
        			.x(function(d) { return self.x(d.date) })
        			.y(function(d) { return self.y(d.count)})

        //labels
        self.graph.append("text")
            .attr("transform",
                "translate(" + ((width/2) +  margin.left)+ " ," +
                (self.height + margin.top + 40) + ")")
            .style("text-anchor", "middle")
            .text("Date");

        self.graph.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 )
            .attr("x",0 - (self.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of fires");
		// Histogram bin per 10 days or, or just check the fires per day?
		console.log("Berend: Init complete")

		// @TODO: Enable animation

	}

	function plot(startDate, endDate, plotData) {
        let bins = self.histogram(plotData);
        let gapSize = 1;
        let width = self.x(bins[0].x1) - self.x(bins[0].x0) - gapSize;

        console.log("plot called", bins);

        // Get entries per day (@TODO: filter out fires with missing end days if this plot is too chaotic?)
        // @TODO: perhaps make into a promise instead?

        let startTime = Date.now();
        var entries = []

		var maxNumberOfFires = 0;
        for (var date = startDate; date <= endDate; date = addDays(date, 1)) {
        	let numberOfFires = getSliceWithinRange(date, date, plotData).length;
        	maxNumberOfFires = Math.max(numberOfFires, maxNumberOfFires);

        	entries.push({date: date, count: numberOfFires});
        }
        let endTime = Date.now();
        console.log("Entries array: ", entries, "Took: ", endTime - startTime)

        // Update x axis
        // @TODO: Add year markers?
        self.x.domain([startDate, endDate]);
		self.xAxis.call(d3.axisBottom(self.x));

		// Update y axis
		self.y = self.y.domain([0,maxNumberOfFires]);
		self.yAxis.call(d3.axisLeft(self.y));

        // Plot entries per day
        // self.plotLine.datum(entries).attr("d", line);
        console.log(self.plotLine)
        self.plotLine.attr("d", self.line(entries));
		console.log("Finished updating plot!");
        // self.plot.selectAll('rect').data(bins).exit().remove();
        // self.plot.selectAll('rect').data(bins).enter().append("rect");
        // self.plot.selectAll("rect")
        //     .data(bins)
        //     .transition()
        //     .duration(500)
        //     .attr("transform", function(d) {
        //         return "translate(" + self.x(d.x0) + "," +  self.y(d.length)  + ")"; }) //self.y(d.length)
        //     .attr("fill", "blue")
        //     .attr("x", gapSize)
        //     .attr("width", width)
        //     .attr("height", function(d) {
        //         return self.height- self.y(d.length)});


        // // add the y Axis
        // self.yAxis.transition().call(d3.axisLeft(self.y));

        // console.log("Berend: Plot complete")
	}
	return {
		initPlot, plot
	};
}