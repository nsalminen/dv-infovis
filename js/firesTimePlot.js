
function randomTest() {
	console.log("THIS IS FUCKING WEIRD");
	return 'a';
}

function FireTimePlot() {
	let self = this;

	function initPlot() {
		let margin = {top: 20, right: 100, bottom: 30, left: 50};
		let width = 960 - margin.left - margin.right;
		self.height = 500 - margin.top - margin.bottom;
		self.graph = d3.select('#graphFiresTimePlot');

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

        var searchData = plotData.filter(function (e) {
            return e['CONT_DATE'] !== '';
        });

        for (var date = startDate; date <= endDate; date = addDays(date, 1)) {
        	let numberOfFires = getSliceWithinRange(date, date, searchData).length;
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
        self.plotLine.attr("d", self.line(entries));
	}

	return {
		initPlot, plot
	}

}