var svg = d3.select('.map-container').append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .attr('viewBox','0 0 960 600')
    .attr('preserveAspectRatio','xMinYMin')
    .append("g");

var projection = d3.geoAlbersUsa()
    .scale(1280) // Scale taken from projection of us-10m.v1.json
    .translate([960 / 2, 600 / 2]);
var pathProjection = d3.geoPath().projection(projection);
var path = d3.geoPath();

this.drought = {};

plotUS();

function plotUS() {
    d3.csv("data/states.csv", function(data) {
       this.states = data;
    });
    plotCounties()
        .then(result => plotStates())
        .then(result => plotMTBS())
        .then(result => loadDrought(2001))
        .then(result => startAnimate());
}

function startAnimate() {
    let date = new Date(Date.UTC(2001,0,1,0,0,0));
    window.setInterval(function() {
        console.log(date.toDateString());
        let start =Date.now();
        let colorPromise = colorDrought(date);
        date = addDays(date, 30);
        colorPromise.then(result => {
            let end = Date.now();
            let diff = end - start;
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
            d3.csv("data/drought/"+year+"/"+state+".csv", function(error, request) {
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

async function plotMTBS() {
    console.log("Plotting MTBS")
    return new Promise((resolve, reject) => {
        d3.json("data/mtbs_perims_DD_2000_2015.json", function (error, fireArea) {
            if (error) reject(error);
            console.log(fireArea.objects);
            svg.append("g")
                .attr("class", "fireArea")
                .selectAll("path")
                .data(topojson.feature(fireArea, fireArea.objects.mtbs_perims_DD).features)
                .enter().append("path")
                .attr("d", pathProjection);
            console.log(topojson.feature(fireArea, fireArea.objects.mtbs_perims_DD).features.length)
            resolve();
        });
    });
}

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}


function calculateColor(drought) {
    if (drought !== undefined) {
        let droughtFactor = drought.D0 * 0.2 + drought.D1 * 0.4 + drought.D2 * 0.6 + drought.D3 * 0.8 + drought.D4 * 1;
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


/**
 * Use binary search to find the first record that has the date in its range.
 * @param data
 * @param date
 * @returns {number} the index of the first record.
 */
function searchStart(data, date) {
    let lower = 0;
    let upper = data.length - 1;
    while (lower < upper) {
        let index = Math.round((lower + upper) / 2);
        let d = data[index];
        let startDate = Date.parse(d.ValidStart);
        if (startDate > date) {
            if (upper == index)
                break;
            upper = index;
            continue;
        }
        let endDate = Date.parse(d.ValidEnd);
        if (endDate < date) {
            if (lower == index)
                break;
            lower = index;
            continue;
        }
        while (index > 0) {
            index--;
            if (Date.parse(data[index].ValidEnd) < date){
                return index + 1;
            }
        }
        return index;
    }
    return lower

}


function setDroughtColor(drought, date) {
    let start = searchStart(drought, date);
    for(let index = start; index < drought.length; index++) {
        let start = Date.parse(drought[index].ValidStart);
        if (start > date)
            return;
        colorElement(drought[index])
    }
}

function colorElement(d) {
    let fips = parseInt(d.FIPS);
    let element = document.getElementById(fips);
    if (element !== null) {
        element.style.fill = calculateColor(d);
    }
}

async function colorDrought(date, state) {
    if (state === undefined) {
        return Promise.all(this.states.map(s => colorDrought(date, s.Code)));
    }

    return new Promise(resolve => {
        let year = date.getFullYear();
        loadDrought(year, state).then(function (drought) {
            setDroughtColor(drought, date);
            resolve('done')
        });
    })
}