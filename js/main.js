var svg = d3.select("svg");
var path = d3.geoPath();

plotCounties();

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

        this.counties = topojson.feature(us, us.objects.counties).features;

        svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(counties)
            .enter().append("path")
            .attr("d", path);

        svg.append("path")
            .attr("class", "county-borders")
            .attr("d", path(topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b; })));

        d3.queue()
            .defer(d3.csv, "data/combined_drought.csv")
           // .defer(d3.csv, "data/dm_export_19920101_20151231 (12).csv")


            .await(analyze);
    });
}


function analyze(error, drought) {
    if (error) {
        console.log(error);
    }
    this.drought = drought;
    var date = new Date(2000,0,1);
    window.setInterval(function() {
        console.log(date.toDateString())
        colorDrought(date);
        date = addDays(date, 30);
    }, 5000);
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function colorDrought(datum) {
    var filtered = drought.filter(function (d) {
        var parsedDate =   Date.parse(d.ValidEnd)
        var test = addDays(datum,-8)
        return parsedDate < datum && parsedDate > addDays(datum,-7)
    })

    filtered.forEach(function (d) {
        counties.filter(function (c) {
            return c.id === d.FIPS
        }).forEach(function (c) {
            c.drought = d
        })
    })

    svg.selectAll(".counties > path").data(counties).attr("d", path).attr("fill", function (d) {
        if (d.drought !== undefined) {
            var droughtFactor = d.drought.D0 * 0.2 + d.drought.D1 * 0.4 + d.drought.D2 * 0.6 + d.drought.D3 * 0.8 + d.drought.D4 * 1;
            droughtFactor = droughtFactor / 100;
            return d3.interpolateHcl('#00AA00', '#AA0000')(droughtFactor);
        } else {
            return "light-gray";
        }
    });
}


