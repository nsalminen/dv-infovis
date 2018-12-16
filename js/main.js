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

var initJobCount = 5;

this.drought = {};

initTimeline();
var graph = d3.select("#graph");

plotUS();
let plot = new droughtAreaPlot();
plot.initPlot();
plotStackedGraph("TX");

function droughtAreaPlot() {
    let self = this;

    function initPlot() {
        let margin = {top: 20, right: 100, bottom: 30, left: 50};
        let width = 960 - margin.left - margin.right;
        let height = 500 - margin.top - margin.bottom;

        self.x = d3.scaleTime().range([0, width]);
        self.y = d3.scaleLinear().range([height, 0]).domain([0, 100]);

        self.area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(function (d) {
                return self.x(d.data.date);
            })
            .y0(function (d) {
                return self.y(d[0]);
            })
            .y1(function (d) {
                return self.y(d[1]);
            });

        self.keys = ["None", "D0", "D1", "D2", "D3", "D4"]

        self.colors = d3.scaleOrdinal(d3.schemeCategory10).domain(self.keys);

        self.stack = d3.stack().keys(self.keys)
            .order(d3.stackOrderReverse)
            .offset(d3.stackOffsetNone)


        self.plot = graph
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // add the X Axis
        self.xAxis = self.plot.append("g")
            .attr("transform", "translate(0," + height + ")");
        self.xAxis
            .call(d3.axisBottom(self.x));

        // add the Y Axis
        self.plot.append("g")
            .call(d3.axisLeft(self.y));

        self.legend = graph.selectAll(".legend")
            .data(self.colors.domain()).enter()
            .append("g")
            .attr("class","legend")
            .attr("transform", "translate(" + (width +70 ) + "," + (margin.top+10)+ ")");

        self.legend.append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) { return 20 * i; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d, i) {
                return self.colors(i);});

        self.legend.append("text")
            .attr("x", 20)
            .attr("dy", "0.75em")
            .attr("y", function(d, i) { return 20 * i; })
            .text(function(d) {return d});
    }

    function plotDrought(plotData) {
        self.x.domain(d3.extent(plotData, function (d) {
            return d.date;
        }));
        self.xAxis
            .call(d3.axisBottom(self.x));
        let series = self.stack(plotData);

        self.plot.selectAll('.droughtArea').data(series).exit().remove();
        self.plot.selectAll('.droughtArea').data(series).enter()
            .append("path").attr("class", "droughtArea");
        self.plot.selectAll('.droughtArea').data(series)
            .transition()
            .duration(500)
            .attr("d", self.area)
            .style("fill", function (d, i) {
                return self.colors(i);
            });

    }
    return {
        initPlot, plotDrought
    }
}


function plotStackedGraph(state) {
    getDrougtData(new Date(Date.UTC(2001,0,1,0,0,0)), new Date(Date.UTC(2002,0,1,0,0,0)),30,state)
}


function getDrougtData(startDate, endDate, steps, state) {
    let dataPromise = new Promise(function (resolve, reject) {
        //  console.log("Start reading " + year + " " + state);
        d3.csv("data/drought/state/" + state + ".csv", function (error, data) {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                let filtered = data.filter(d => {
                    let start = Date.parse(d.ValidStart);
                    let end = addDays(Date.parse(d.ValidEnd),1);
                    return start <= endDate && end >= startDate
                });
                resolve(filtered);
            }
        });
    });

    let diff = endDate - startDate;
    let dayStep = Math.max(Math.floor(diff / (1000 * 60 * 60 * 24 * steps)), 1);
    let dateRange = d3.timeDays(startDate, endDate, dayStep);
    dataPromise.then(data => {
        let plotData = dateRange.map(date => {
            let record = data.find(d => {
                let start = Date.parse(d.ValidStart);
                let end = addDays(Date.parse(d.ValidEnd),1);
                return start <= date && end > date
            });

            if (record !== undefined)
                return {
                    date: date,
                    None: parseFloat(record["None"]),
                    D0: parseFloat(record["D0"]),
                    D1: parseFloat(record["D1"]),
                    D2: parseFloat(record["D2"]),
                    D3: parseFloat(record["D3"]),
                    D4: parseFloat(record["D4"])
                }
            else
                return {date: date, None: 0, D0: 0, D1: 0, D2: 0, D3: 0, D4: 0}
        });
        plot.plotDrought(plotData);
    })
}

states = {}

function finishInit(){
    updateInitText("Done")
    $('.fade').fadeOut(300)
}

function updateInitText(text) {
    $('#init-progress-text').fadeOut(300, function() {
        $(this).text(text + "...").fadeIn(400);
    });
}

function plotUS() {
    updateInitText("Plotting map");
    d3.csv("data/states.csv", function(data) {
       states = data;
    });
    plotCounties()
        .then(result => plotStates())
        .then(result => plotMTBS())
        .then(result => loadDrought(2001))
        .then(result => startAnimate())
        .then(result => finishInit());
}

function initTimeline(){
    updateInitText("Loading timeline");
    var lang = "en-US";
    var year = 2018;

    function dateToTS (date) {
        return date.valueOf();
    }

    function tsToDate (ts) {
        var d = new Date(ts);

        return d.toLocaleDateString(lang, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    $(".date-slider").ionRangeSlider({
        skin: "flat",
        type: "double",
        grid: true,
        min: dateToTS(new Date(2000, 0, 1)),
        max: dateToTS(new Date(2015, 11, 31)),
        from: dateToTS(new Date(2005, 10, 8)),
        to: dateToTS(new Date(2005, 12, 23)),
        prettify: tsToDate
    });
}

function startAnimate() {
    console.log("start");
    let date = new Date(Date.UTC(2001,0,1,0,0,0));
    window.setInterval(function() {
        console.log(date.toDateString());
        let start =Date.now();
        let colorPromise = colorDrought(date);
        date = addDays(date, 30);
        if (date.getFullYear() === 2002) {
            date.setFullYear(2001);
        }
        colorPromise.then(result => {
            let end = Date.now();
            let diff = end - start;
            console.log("done in: " + diff);
            loadDrought(date.getFullYear())
        });
    }, 2000);
    console.log("Hello");
}

async function plotStates() {
    updateInitText("Plotting US states");
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
                .attr("id", (i) => {
                    let asf = parseInt(i.id)
                })
                .on("click", function(d) {
                    let state = states.find(s => {
                        return parseInt(s.Id) ==  parseInt(d.id);})
                    if (state != undefined) {
                        plotStackedGraph(state.Code);
                        console.log("clicked " + state.Code);
                    }

                });


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
    updateInitText("Plotting US counties");
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
    updateInitText("Loading drought data");
    if(state === undefined) {
        return Promise.all(states.map(s => loadDrought(year, s.Code)));
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
        let endDate = addDays(Date.parse(d.ValidEnd),1);
        if (endDate < date) {
            if (lower == index)
                break;
            lower = index;
            continue;
        }
        while (index > 0) {
            index--;
            if (addDays(Date.parse(data[index].ValidEnd),1) < date){
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
        let startDate = new Date(Date.parse(drought[index].ValidStart));
        if (startDate > date)
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
        return Promise.all(states.map(s => colorDrought(date, s.Code)));
    }

    return new Promise(resolve => {
        let year = date.getFullYear();
        loadDrought(year, state).then(function (drought) {
            setDroughtColor(drought, date);
            resolve('done')
        });
    })
}