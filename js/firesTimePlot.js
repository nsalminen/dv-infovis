function firesTimePlot() {
	let self = this;

	function initPlot() {
		let margin = {top: 20, right: 100, bottom: 30, left: 50};
		let width = 960 - margin.left - margin.right;
		self.height = 500 - margin.top - margin.bottom;
		self.graph = d3.select('#graphFiresTimePlot');

		self.x = d3.scaleTime().range([0, width]);
		self.y = d3.scaleLinear().range([height, 0]).domain([0, 100]);


		// Histogram bin per 10 days or so?






	}

	function plot(plotData) {
		


	}

	return {
		initPlot, plot;
	}

}