var svg = d3.select("svg");
var path = d3.geoPath();

this.drought = {};

plotUS();


function plotUS() {
    d3.csv("data/states.csv", function(data) {
       this.states = data;
    });
    plotCounties()
        .then(result => plotStates())
        .then(result => loadDrought(2001))
        .then(result => startAnimate());
}

function startAnimate() {
    var date = new Date(2001,0,1);
    window.setInterval(function() {
        console.log(date.toDateString());
        var start =Date.now();
        let state = 'TX';
        colorDrought(date).then(result => {
            var end = Date.now();
            var diff = end - start;
            console.log("done in: " + diff);
        });
        date = addDays(date, 30);
    }, 5000);
}

async function plotStates() {
    return new Promise((resolve, reject) => {
        d3.json("https://d3js.org/us-10m.v1.json", function (error, us) {
            if (error)
                reject(error)

            svg.append("g")
                .attr("class", "states")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                .enter().append("path")
                .attr("d", path)

            svg.append("path")
                .attr("class", "state-borders")
                .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
                    return a !== b;
                })));

            console.log("state loaded")
            resolve();
        });
    });
}

function plotCounties() {
    return new Promise((resolve, reject) => {
    d3.json("https://d3js.org/us-10m.v1.json", function (error, us) {
        if (error)
            reject(error);

        this.counties = topojson.feature(us, us.objects.counties).features;

        svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(counties)
            .enter().append("path")
            .attr("d", path);

        svg.append("path")
            .attr("class", "county-borders")
            .attr("d", path(topojson.mesh(us, us.objects.counties, function (a, b) {
                return a !== b;
            })));

        console.log("counties loaded")
        resolve();
    });
    });
}

function loadData() {
    d3.csv("data/split/dm_export_19920101_20151231 (12).csv", analyze)
    //  d3.csv("data/combined_drought.csv", analyze)
}

async function loadDrought(year, state) {
    if(state === undefined) {
        return Promise.all(this.states.map(s => loadDrought(year, s.Code)));
    }

    if (!(year in this.drought)) {
        this.drought[year] = {};
    }

    if (!(state in this.drought[year])) {
        // store the promise so that the data will be loaded once.
        this.drought[year][state] = new Promise(function (resolve, reject){
            console.log("Start reading " + year + " " + state);
            d3.csv("data/split/drought_"+year+"_"+state+".csv", function(error, request) {
                if(error) {
                    console.log(error);
                    reject(error);
                } else {
                 //   console.log("Loaded " + year + " " + state);
                    resolve(request);
                }
            });
        });
    }
    return this.drought[year][state];
}

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

async function colorDrought(date, state) {
    if(state === undefined) {
        return Promise.all(this.states.map(s => colorDrought(date, s.Code)));
    }

    return new Promise( resolve => {
        let year = date.getFullYear();
        loadDrought(year, state).then( function(drought) {
            var filtered = drought.filter(function (d) {
                let endDate = Date.parse(d.ValidEnd);
                let startDate = Date.parse(d.ValidStart);
                return startDate <= date && endDate >= date
            });

            filtered.forEach(function (d) {
                counties.filter(function (c) {
                    return parseInt(c.id) === parseInt(d.FIPS);
                }).forEach(function (c) {
                    c.drought = d
                })
            });

            svg.selectAll(".counties > path").data(counties).attr("d", path).attr("fill", function (d) {
                if (d.drought !== undefined) {
                    var droughtFactor = d.drought.D0 * 0.2 + d.drought.D1 * 0.4 + d.drought.D2 * 0.6 + d.drought.D3 * 0.8 + d.drought.D4 * 1;
                    droughtFactor = droughtFactor / 100;
                    return d3.interpolateHcl('#00AA00', '#AA0000')(droughtFactor);
                } else {
                    return "light-gray";
                }
            });

            resolve('done')
        });
    })
}
