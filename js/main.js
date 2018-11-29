var svg = d3.select("svg");
var path = d3.geoPath();

plotStates();

function plotStates() {
    d3.json("https://d3js.org/us-10m.v1.json", function (error, us) {
        if (error) throw error;

        svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
            .attr("d", path);

        svg.append("path")
            .attr("class", "state-borders")
            .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
                return a !== b;
            })));
    });
}

function plotCounties() {
    d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
        if (error) throw error;

        svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.counties).features)
            .enter().append("path")
            .attr("d", path);

        svg.append("path")
            .attr("class", "county-borders")
            .attr("d", path(topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b; })));
    });
}