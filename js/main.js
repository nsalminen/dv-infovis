var svg = d3.select("svg");
var projection = d3.geoAlbersUsa()
    .scale(1280) // Scale taken from projection of us-10m.v1.json
    .translate([960 / 2, 600 / 2]);
var pathProjection = d3.geoPath().projection(projection);
var path = d3.geoPath();

plotStates();
plotMTBS();

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

function plotMTBS(){
    d3.json("data/mtbs_perims_DD_2000_2015.json", function (error, fireArea) {
        if (error) throw error;
        console.log(fireArea.objects);
        svg.append("g")
            .attr("class", "fireArea")
            .selectAll("path")
            .data(topojson.feature(fireArea, fireArea.objects.mtbs_perims_DD).features)
            .enter().append("path")
            .attr("d", pathProjection);
        console.log(topojson.feature(fireArea, fireArea.objects.mtbs_perims_DD).features.length)
    });
}