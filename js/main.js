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
        var colorPromise = colorDrought(date);
        date = addDays(date, 30);
        colorPromise.then(result => {
            var end = Date.now();
            var diff = end - start;
            console.log("done in: " + diff);
            loadDrought(date.getFullYear())
        });
    }, 1000);
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
        this.countiesMap = new Map(this.counties.map(i => [parseInt(i.id), i]));
        svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(counties)
            .enter().append("path")
            .attr("d", path)
            .attr("id", (i) => parseInt(i.id));

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
          //  console.log("Start reading " + year + " " + state);
            d3.csv("data/split/drought/"+year+"/"+state+".csv", function(error, request) {
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


function calculateColor(drought) {
    if (drought !== undefined) {
        var droughtFactor = drought.D0 * 0.2 + drought.D1 * 0.4 + drought.D2 * 0.6 + drought.D3 * 0.8 + drought.D4 * 1;
        droughtFactor = droughtFactor / 100;
        return d3.interpolateHcl('#00AA00', '#AA0000')(droughtFactor);
    } else {
        return "light-gray";
    }
}
function colorMap() {
    svg.selectAll(".counties > path").data(counties).attr("d", path).attr("fill", function (d) {
        return calculateColor(d.drought);
    });
}

function filterData(drought, date) {
    var filtered = drought.filter(function (d) {
        let endDate = Date.parse(d.ValidEnd);
        let startDate = Date.parse(d.ValidStart);
        return startDate <= date && endDate >= date
    });

    //much faster than colorMap
    filtered.forEach(function (d) {
        let fips = parseInt(d.FIPS);
        let element = document.getElementById(fips);
        if (element !== null) {
            element.style.fill = calculateColor(d);
        }
    });
}

async function colorDrought(date, state) {
    if (state === undefined) {
        return Promise.all(this.states.map(s => colorDrought(date, s.Code)));
    }

    return new Promise(resolve => {
        let year = date.getFullYear();
        loadDrought(year, state).then(function (drought) {
            filterData(drought, date);
            resolve('done')
        });
    })
}
