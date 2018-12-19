var svg = d3.select('.map-container').append("svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .attr('viewBox','0 0 960 600')
    .attr('preserveAspectRatio','xMinYMin')
    .append("g");

let colorInterpolate = d3.scaleLinear()
    .domain([0, 1])
    .range(["#fff5eb", "#7f2704"]).interpolate(d3.interpolateHcl);
/* colorInterpolate = d3.scaleLinear()
    .domain([0, 1/5, 2/5, 3/5, 4/5, 1])
    .range([
        '#feedde',
        '#fdd0a2',
        '#fdae6b',
        '#fd8d3c',
        '#e6550d',
        '#a63603'
    ]) .interpolate(d3.interpolateHcl)*/


var projection = d3.geoAlbersUsa()
    .scale(1280) // Scale taken from projection of us-10m.v1.json
    .translate([960 / 2, 600 / 2]);
var pathProjection = d3.geoPath().projection(projection);
var path = d3.geoPath();
var animationInterval;

window.drought = {};
window.fires = {};
window.mtbs = null;
states = {};

window.uiState = {
    from: new Date(2000, 0, 1),
    to: new Date(2001, 11, 31),
    currentState: "TX",
    animationActive: false,
    animationPaused: false,
    mtbsCumulative: false,
    selectedPlot: ""
};

window.stateFipsCodes = {'01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY', '60': 'AS', '64': 'FM', '66': 'GU', '68': 'MH', '69': 'MP', '70': 'PW', '72': 'PR', '74': 'UM', '78': 'VI'};

initTimeline();

plotUS();

let droughtAreaPlot = new DroughtAreaPlot();
droughtAreaPlot.initPlot();

let fireDroughtPlot = new FireDroughtPlot();
fireDroughtPlot.initPlot();

let fireTimePlot = new FireTimePlot();
fireTimePlot.initPlot();

let fireCauseBarChart = new FireCauseBarChart();
fireCauseBarChart.initPlot();
// @TODO: Hook to update on state select

//updatePlots();
initMapControls();
initModals();

var resizeDelay;
$(window).on('resize', function(){
    clearTimeout(resizeDelay);
    resizeDelay = setTimeout(reloadPlots, 500);
});

function initModals() {
    $('.modal-button').hide();
    $('.modal-button').click(function() {
        $('#info-' + uiState.selectedPlot).addClass("active");
    });

    $('.modal .btn-clear').click(function() {
        $('#info-' + uiState.selectedPlot).removeClass("active");
    });

    $('#select-types .btn-primary, #select-types .btn-clear').click(function() {
        $('#select-types').removeClass("active");
    });

    $('#open-cause-modal').click(function() {
        $('#select-types').addClass("active");
    });
}

function initMapControls() {
    $('input:checkbox').change(
        function(){
                switch ($(this).attr('id')) {
                    case "drought-switch":
                        if ($(this).is(':checked')) {
                            startAnimate();
                        } else {
                            clearInterval(animationInterval);
                            clearDrought();
                        }
                        break;
                    case "fire-switch":

                        break;
                    case "fire-cum-switch":
                        break;
                    case "burn-switch":
                        break;
                    case "burn-cum-switch":
                        uiState.mtbsCumulative = $(this).is(':checked');
                        break;
            }
        });
}

async function loadFires(year, state) {
    if (state === undefined) {
        return Promise.all(this.states.map(s => loadFires(year, s.Code)));
    }
    if (!(year in this.fires)) {
        this.fires[year] = {};
    }
    if (!(state in this.fires[year])) {
        this.fires[year][state] = new Promise(function (resolve, reject){
            let path = "data/fires/" + year + "/fires_" + year + "_" + state + ".csv";
            d3.csv(path, function(error, request) {
                if(error) {
                    console.log(error);
                    reject(error);
                } else {
                    resolve(request);
                }
            });
        });
    }
    return this.fires[year][state];
}

async function plotFires(startDate, endDate, state, filterSet) {
    if (state === undefined) {
        // state = "CA";           // @TODO: Return Promise.all instead
        return Promise.all(this.states.map(s => plotFires(startDate, endDate, s.Code, filterSet)));
    }

    return new Promise((resolve, reject) => {
        let fireYear = date.getFullYear();
        
        loadFires(fireYear, state).then(function (firedata) {
            // Comb through csv to figure out what data to keep
            let newFireData = firedata.filter(function (e) {
                return !(e["FIRE_SIZE_CLASS"] === "B") && filterSet.has(e['STAT_CAUSE_CODE']);
            });
            let slice = getSliceWithinRange(startDate, endDate, newFireData);

            // Plot fires
            svg.selectAll("circle."+state)
                .data(slice).enter()
                .append("circle")
                .attr("cx", function (d) { return projection([parseFloat(d['LONGITUDE']), parseFloat(d['LATITUDE'])])[0]; })
                .attr("cy", function (d) { return projection([parseFloat(d['LONGITUDE']), parseFloat(d['LATITUDE'])])[1]; })
                .attr("r", "2px")
                .attr("fill", function(d) {
                    if (d['FIRE_SIZE_CLASS'] === 'B') {
                        return 'blue';
                    }
                    if (d['FIRE_SIZE_CLASS'] === 'C') {
                        return 'yellow';
                    }
                    return 'red';
                })
                .attr("class", state);
            svg.selectAll("circle."+state)
                .data(slice).exit().remove();

            resolve();
        });
    });
}

function getSliceWithinRange(startDate, endDate, firedata)
{
    var end;
    for (var i = 0; i < firedata.length; i++) {
        if (firedata[i] === undefined) {
            console.log("Undefined", firedata);
            return;
        }

        if (new Date(firedata[i]['DISCOVERY_DATE']) >= endDate) {
            end = i;
            break;
        }
    }

    let plotdata = firedata.slice(0, end).filter(function (e) {
        let fireStart = new Date(e['DISCOVERY_DATE']);

        // If fire starts in our tracking range
        if (fireStart >= startDate && fireStart <= endDate)
        {
            return true;
        }

        if (e['CONT_DATE'] !== '')
        {
            // If Containment date is known, see if it's within our range
            let fireEnd = new Date(e['CONT_DATE']);
            return fireEnd >= startDate;
        } else {
            // If not known, and fireStart + month is > startDate
            return addDays(fireStart, 7) >= startDate;
        }
    });

    return plotdata;
}

function plotFireCauseBar(fireData) {
    let causeCount = [];
    for (let index = 0; index < fireData.length; ++index) {
        let fire = fireData[index];
        let code = parseInt(fire["STAT_CAUSE_CODE"]);
            if (causeCount[code] === undefined) {
                causeCount[code] = 0;
            }
        causeCount[code] += 1;
    }
    fireCauseBarChart.plot(causeCount);
}

function plotFireDroughtHist(fireData, state, from, to) {
    //TODO get fire dates and counties
    let yearStart = from.getFullYear();
    let yearEnd = to.getFullYear();
    let years = Array.apply(null, Array(yearEnd - yearStart+ 1)).map(function (x, i) { return i + yearStart; });

    let compactFireData = {};
    for (let index = 0; index < fireData.length; ++index) {
        let fire = fireData[index];
        let dateString = fire["DISCOVERY_DATE"];
        let county = parseInt(fire["FIPS"]);
        if (!(dateString in compactFireData))
            compactFireData[dateString] = [];
        if (!(county in compactFireData[dateString]))
            compactFireData[dateString][county] = 0;
        compactFireData[dateString][county] += 1;
    }
    Promise.all(years.map(x=>loadDrought(x, state))).then(droughtData => {
        let plotData = [];
        for (let key in compactFireData) {
            let date = new Date(Date.parse(key));
            let year = date.getFullYear();
            let dIndex = years.indexOf(year);
            let drought = droughtData[dIndex];
            let start = searchStart(drought, date);
            let droughtDate = date;
            while (droughtDate <= date && start < drought.length) {
                let d = drought[start];
                start++;
                droughtDate = Date.parse(d.ValidStart);
                let fips = parseInt(d.FIPS);
                if (fips in compactFireData[key]) {
                    let number = compactFireData[key][fips];
                    compactFireData[key][fips] = 0;
                    let D0 = parseFloat(d["D0"]);
                    let D1 = parseFloat(d["D1"]);
                    let D2 = parseFloat(d["D2"]);
                    let D3 = parseFloat(d["D3"]);
                    let D4 = parseFloat(d["D4"]);
                    let drought = (D0 * 0.2 + D1 * 0.4 + D2 * 0.6 + D3 * 0.8 + D4 * 1)/100;
                    for (let i = 0; i < number; i++) {
                        plotData.push(drought)
                    }
                }
            }
        }
        fireDroughtPlot.plot(plotData);
    });
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
                };
            else
                return {date: date, None: 0, D0: 0, D1: 0, D2: 0, D3: 0, D4: 0}
        });
        droughtAreaPlot.plotDrought(plotData);
    })
}



function finishInit(){
    updateInitText("Done");
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

    plotCounties()
        .then(result => plotStates())
        .then(result => loadMTBS())
        .then(result => loadDrought(2001))
        .then(result => startAnimate())
        .then(result => finishInit());
    });
}

function updatePlots() {
    var self = this;
    let from = uiState.from;
    let to = uiState.to;
    let state = uiState.currentState;

    getDrougtData(from, to,100,state);
    // plotFireDroughtHist(state);
    let dt = Date.now();

    let yearStart = from.getFullYear();
    let yearEnd = to.getFullYear();
    let years = Array.apply(null, Array(yearEnd - yearStart+ 1)).map(function (x, i) { return i + yearStart; });

    Promise.all(years.map(s =>    loadFires(s, state))).then(dataPerYear => {
        let data = dataPerYear.flat();
        let dataslice = getSliceWithinRange(from, to, data);
        console.log("resulting data", dataslice, from, to, state);
        fireTimePlot.plot(from, to, dataslice);

        plotFireDroughtHist(dataslice, state, from, to);
        plotFireCauseBar(dataslice)
        // @TODO: Call update on firesTimePlot() with this data
    });
}

function reloadPlots() {
    droughtAreaPlot.redraw();
    fireDroughtPlot.redraw();
    fireTimePlot.redraw();
    fireCauseBarChart.redraw();
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

    let rangeChangeDelay;
    var self = this;

    $(".date-slider").ionRangeSlider({
        skin: "flat",
        type: "double",
        grid: true,
        min: dateToTS(new Date(2000, 0, 1)),
        max: dateToTS(new Date(2015, 11, 31)),
        from: dateToTS(uiState.from),
        to: dateToTS(uiState.to),
        prettify: tsToDate,
        onChange: function (data) {
            uiState.from = new Date(data.from);
            uiState.to = new Date(data.to);
            clearTimeout(rangeChangeDelay);
            rangeChangeDelay = setTimeout(function () {reloadPlots(); startAnimate()}, 500);
        },
    });
    initUI();
}

function initUI() {
    d3.selectAll(".menu-item a").on("click", function(e, d) {
        d3.select(".plot-container .empty").style("display", "none");
        uiState.selectedPlot = d3.select(this).attr("data-graph");
        console.log('info-' + uiState.selectedPlot);
        if ($('#info-' + uiState.selectedPlot).length) {
            $('.modal-button').show();
        } else {
            $('.modal-button').hide();
        }
        // Hide all other plot graphs
        d3.selectAll(".plot-container .graph").style("display", "none");

        let selectedPlot = d3.select(d3.select("#"+uiState.selectedPlot).node());
        selectedPlot.style("display", "block")
        // Set currently selected plot to visible
        // el.attr("data-graph")
    });

    d3.selectAll(".resize-button-right").on("click", function(e, d) {
        d3.selectAll(".right-column")
            .classed("col-5", false).classed("col-7", true);
        d3.selectAll(".left-column").classed("col-5", true).classed("col-7", false);
        reloadPlots();
    });
    d3.selectAll(".resize-button-left").on("click", function(e, d) {
        d3.selectAll(".left-column").classed("col-5", false).classed("col-7", true);
        d3.selectAll(".right-column").classed("col-5", true).classed("col-7", false);
        reloadPlots();
    });
}

function pauseAnimate(){
    if (uiState.animationPaused){
        uiState.animationPaused = false;
        $(".timeline-control-container .pause-button").removeClass("active");
        $(".timeline-control-container .pause-button").text("Pause");
    } else {
        uiState.animationPaused = true;
        $(".timeline-control-container .pause-button").addClass("active");
        $(".timeline-control-container .pause-button").text("Paused");
    }
}

function startAnimate() {
    uiState.animationActive = true;
    if (uiState.animationPaused){
        uiState.animationPaused = false;
        $(".timeline-control-container .pause-button").removeClass("active");
        $(".timeline-control-container .pause-button").text("Pause");
    }
    $(".timeline-control-container .start-button").text("Restart");
    clearInterval(animationInterval);
    let date = new Date(uiState.from);
    animationInterval = window.setInterval(function() {
        if (!uiState.animationPaused){
            console.log(date.toDateString());
            $('.map-subtitle').fadeOut(200, function() {
                $(this).text(date.toLocaleString('en-us', { month: "long" }) + ' ' + date.getFullYear()).fadeIn(300);
            });
            let start = Date.now();
            let colorPromise = colorDrought(date);
            plotMTBS(date);
            date.setMonth(date.getMonth() + 1);
            if (date >= uiState.to) {
                date = new Date(uiState.from.getTime());
            }
            colorPromise.then(result => {
                let end = Date.now();
                let diff = end - start;
                //console.log("done in: " + diff);
                loadDrought(date.getFullYear())
            });
        }
    }, 1500);
}

async function plotStates() {
    let self = this;
    updateInitText("Plotting US states");
    return new Promise((resolve, reject) => {
        d3.json("https://d3js.org/us-10m.v1.json", function (error, us) {
            if (error) reject(error);
                  
            svg.append("g")
                .attr("class", "states")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                .enter().append("path")
                .attr("d", path)
                .attr("id", (i) => {
                    return parseInt(i.id)
                })
                .on("click", function(d) {
                    let state = self.stateFipsCodes[d.id];
                    if (state != undefined) {
                        self.uiState.currentState = state;
                        updatePlots();
                    }
                });

            svg.append("path")
                .attr("class", "state-borders")
                .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
                    return a !== b;
                })));
            console.log("state loaded");
            drawGradient();
            resolve();
        });
    });
}

function drawGradient() {
    let width = 300;
    let height = 20;
    //way to complicate to create a legend in the center
    let legend = svg.append('g')
        .attr("transform", "translate(" + (-width/2) + "," + 0  + ")")
        .append('svg').attr("x","50%");
    let defs = legend.append("defs");

    let linearGradient = defs.append("linearGradient")
        .attr("id", "map-gradient");
    linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorInterpolate(0)); //light blue


    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorInterpolate(1));


    legend.append("rect")
        .attr("width", width)
        .attr("height", height)

        .style("fill", "url(#map-gradient)");


    let z = d3.scaleOrdinal()
        .range([0, width])
        .domain(["No drought", "Severe drought"]);

    let zAxis = d3.axisBottom()
        .scale(z);


    legend.append("g")
        .attr("class", "z axis")
        .attr("transform", "translate(0," + height + ")")
        .call(zAxis);

    legend.selectAll("text").filter(t => t == "No drought").style("text-anchor", "start");
    legend.selectAll("text").filter(t => t == "Severe drought").style("text-anchor", "end");

}

function plotCounties() {
    updateInitText("Plotting US counties");
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
            .attr("d", path)
            .attr("id", (i) => parseInt(i.id));

        svg.append("path")
            .attr("class", "county-borders")
            .attr("d", path(topojson.mesh(us, us.objects.counties, function (a, b) {
                return a !== b;
            })));

        console.log("counties loaded");
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

async function loadMTBS(){
    if (window.mtbs != null) {
        return
    }
    updateInitText("Loading burn severity data");
    return new Promise((resolve, reject) => {
        d3.json("data/mtbs_perims_DD_2000_2015.json", function (error, fireArea) {
            if (error) reject(error);
            window.mtbs = topojson.feature(fireArea, fireArea.objects.mtbs_perims_DD).features;
        });
        resolve();
    });
}

function plotMTBS(rangeStart) {
    let rangeEnd;
    if (uiState.mtbsCumulative){
        rangeStart = new Date(uiState.from);
        rangeEnd = new Date(uiState.to);
    } else {
        rangeEnd = new Date(rangeStart.getTime());
        rangeEnd.setMonth(rangeStart.getMonth() + 1);
    }
    svg.selectAll(".fireArea").remove();
    let filteredFeatures = window.mtbs.filter(function(d){
        let date = new Date(d.properties.Year, d.properties.StartMonth, d.properties.StartDay);
        return (date <= rangeEnd && date >= rangeStart);
    });
    svg.append("g")
        .attr("class", "fireArea")
        .selectAll("path")
        .data(filteredFeatures)
        .enter().append("path")
        .attr("d", pathProjection);
}

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}


function calculateColor(drought) {
    if (drought !== undefined) {
        let droughtFactor = parseFloat(drought.D0) * 0.2 + parseFloat(drought.D1) * 0.4 +  parseFloat(drought.D2) * 0.6
            +  parseFloat(drought.D3) * 0.8 +  parseFloat(drought.D4) * 1;
        droughtFactor = droughtFactor / 100;
        return colorInterpolate(droughtFactor);
    } else {
        return "light-gray";
    }
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

function clearDrought() {
    //TODO fix
    let test = d3.selectAll(".counties").selectAll("path");
    test.attr("style", "fill: light-gray");
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