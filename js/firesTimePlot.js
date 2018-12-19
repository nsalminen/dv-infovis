function FireTimePlot() {
	let self = this;

    function initPlot() {
        self.x = d3.scaleTime();
        self.y = d3.scaleLinear().domain([0, 100]);
        initBasisPlot(self, '#graphFiresTimePlot', 'Date', 'Number of fires');
        setPlotSizeValues(self);

        self.histogram = d3.histogram()
            .value(function(d) { return d; })
            .domain(self.x.domain())
            .thresholds(10);

        self.plotLine = self.plot.append("path")
        		.attr("fill", "none")
				.attr("stroke", "steelblue")
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 1.5);
        self.line = d3.line()
        			.x(function(d) { return self.x(d.date) })
        			.y(function(d) { return self.y(d.count)});
      
        redraw();

	}

	function redraw(duration) {
        if (duration === undefined)
            duration = 0;
        setPlotSizeValues(self);
        if(self.entries !== undefined) {
            self.plotLine.attr("d", self.line(self.entries));
        }
    }
	function plot(startDate, endDate, plotData) {
        // Get entries per day
        self.entries = [];

		let maxNumberOfFires = 0;

        let searchData = plotData.filter(function (e) {
            return e['CONT_DATE'] !== '';
        });

        for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
        	let numberOfFires = getSliceWithinRange(date, date, searchData).length;
        	maxNumberOfFires = Math.max(numberOfFires, maxNumberOfFires);

        	self.entries.push({date: date, count: numberOfFires});
        }


        // Update x axis
        self.x.domain([startDate, endDate]);
		self.y.domain([0,maxNumberOfFires]);
		redraw();
	}
	return {
		initPlot, plot, redraw
	};
}