// Initial COMPAS dataset
/* Helper variables */

const parameters = ['priors_count', 'decile_score', 'two_year_recid', 'race'];

/* CITATION (main code for how to get the brushing and parallel coordinates): 
   https://bl.ocks.org/jasondavies/1341281 */
function setupDataVis(div) {
    var margin = {top: 30, right: 10, bottom: 10, left: 0};
    var width = div.width() - margin.left - margin.right;
    var height = div.height() - margin.top - margin.bottom;
    
    var svg = d3.select("#main-intro-graphics")
                .append("svg")
                .attr("width", div.width())
                .attr("height", div.height())
                .append("g") // groups all the SVGs together
                .attr("transform", // creates space for the margins
                      "translate(" + margin.left + "," + margin.top + ")");
    
    return {svg: svg, width: width, height: height};
}

/* CITATION (main code for how to get the brushing and parallel coordinates): 
   https://bl.ocks.org/jasondavies/1341281  (SAME AS ABOVE) */
function loadCsvData(svg, width, height) {
    let url = "https://raw.githubusercontent.com/propublica/compas-analysis/master/compas-scores-two-years.csv";
    var x = d3.scale.ordinal().rangePoints([0, width], 1)
    var y = {};
    var draggingPoints = {};

    var line = d3.svg.line();
    var axis = d3.svg.axis().orient("left");

    d3.csv(url, (_, data) => {
        data = filterCsvData(data);
        let dimensions = Object.keys(data[0]);

        x.domain(dimensions = dimensions);
        for (let i = 0; i < dimensions.length; i++) {
            let name = dimensions[i];
            y[name] = d3.scale.linear()
                        .domain(d3.extent(data, (d) => { return +d[name]; }))
                        .range([height, 0])
        }

        // Adds the lines to the graphs and styles them with the classes.
        background = svg.append("g")
                        .attr("class", "background")
                        .selectAll("path")
                        .data(data)
                        .enter().append("path")
                        .attr("d", path);

        foreground = svg.append("g")
                        .attr("class", "foreground")
                        .selectAll("path")
                        .data(data)
                        .enter().append("path")
                        .attr("d", path);

        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .call(d3.behavior.drag() 
                .origin(function(d) { return {x: x(d)}; })
                .on("dragstart", function(d) { 
                    draggingPoints[d] = x(d);
                    background.attr("visibility", "hidden");
                })
                .on("drag", function(d) { // During drag
                    draggingPoints[d] = Math.min(width, Math.max(0, d3.event.x));
                    foreground.attr("d", path);
                    dimensions.sort(function(a, b) { return position(a) - position(b); });
                    x.domain(dimensions);
                    g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                })
                .on("dragend", function(d) { // What to do at end of drag
                    delete draggingPoints[d];
                    transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                    transition(foreground).attr("d", path);
                    background.attr("d", path)
                            .transition()
                            .delay(500)
                            .duration(0)
                            .attr("visibility", null);
                })
            );

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .text(function(d) { return d; });

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d])
                               .on("brushstart", brushStartEvent)
                               .on("brush", brushEvent));
            })
            .selectAll("rect")
            .attr("x", -7.5) // Makes box in middle of line
            .attr("width", 15); // Makes box width.

        // From the website cited above.
        function position(d) {
            var v = draggingPoints[d];
            if (!v) {
                return x(d);
            } else {
                return v;
            }
        }

        // From the website cited above.
        function transition(g) {
            return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
            return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
        }

        function brushStartEvent() {
            // Stops the graph from moving around as you brush over.
            d3.event.sourceEvent.stopPropagation();
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brushEvent() {
            var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); });
            var extents = actives.map(function(p) { return y[p].brush.extent(); });
            
            foreground.style("display", function(d) {
                return actives.every(function(p, i) {
                    return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                }) ? null : "none";
            });
        }

    })

    $("#main-intro-graphics").addClass('animate__animated animate__fadeInRight');

}

// Creating a bar graph in d3js
// https://bl.ocks.org/d3noob/8952219
function createDataVis(race, divId) {
    div = $('#' + divId);
    var width = 500;
    var height = 500;
    var margin = {top: 30, right: 50, bottom: 70, left: 50};
    width -= margin.left - margin.right;
    height -= margin.top - margin.bottom;

    var svg = d3.select('#' + divId)
              .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");

    // This adds the spaces in between each bar (rangeRoundBands)
    var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);

    // This makes it so that the range goes from 0 to the height, so the
    // largest y value's bar is the height.
    var y = d3.scale.linear().range([height, 0]);

    let url = `https://brenthong.com/ml-bias-visualizer/assets/data/race_to_score_${race}.csv`;
    d3.csv(url, (_, data) => {
        data.forEach((d) => {
            d.count = +d.count;
        });

        // List of all x values by mapping them.
        xDomain = [];
        for (let i = 0; i < data.length; i++) {
            xDomain.push(data[i].decile_score);
        }
        x.domain(xDomain);
        
        // For the way, get the max from the row counts and go from 0 to that.
        y.domain([0, d3.max(data, (row) => { return row.count; })]);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(row) { return x(row.decile_score); })
            .attr("width", x.rangeBand())
            .attr("y", function(row) { return y(row.count); })
            .attr("height", function(row) { return height - y(row.count); });

        svg.append("g")
           .attr("transform", "translate(0," + height + ")")
           .call(d3.svg.axis().scale(x).orient("bottom"));

        svg.append("g").call(d3.svg.axis().scale(y).orient("left"));

        // CITATION (adding axes):
        // https://bl.ocks.org/d3noob/f46a355d35077a7dc12f9a97aeb6bc5d
        svg.append("text")             
            .attr("transform",
                    "translate(" + (width/2) + " ," + 
                                (height + margin.top + 20) + ")")
            .text(`Risk score (out of 10) for ${race}`);
        
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left) // all the way to the left
            .attr("x", -(height / 2)) // middle
            .attr("dy", "1em")
            .text("Count");  
    });    

}

function setupDataVisStory1() {
    createDataVis("african_american", "story1-graph-1");
    createDataVis("white", "story1-graph-2");
}

$(document).ready(function() {
    let div = $("#main-intro-graphics");
    var res = setupDataVis(div);
    loadCsvData(res.svg, res.width, res.height);
    setupDataVisStory1();
});


/* HELPER FUNCTIONS */
function filterCsvData(data) {
    return mapData(data, mapFn);
}

function mapData(data, mapFn) {
    if (data.length === 0) {
        return data;
    }

    return [mapFn(data[0]), ...mapData(data.splice(1, data.length), mapFn)];
}

// Map function code from:
// https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
function mapFn(obj) {
    return Object.keys(obj).filter((key) => parameters.includes(key))
                           .reduce((newObj, key) => {
                                if (key === 'race') {
                                    let val = convertRaceToValue(obj[key]);
                                    newObj[key] = val;
                                } else {
                                    newObj[key] = obj[key];
                                }
                                return newObj;
                           }, {});
}

function convertRaceToValue(race) {
    var val;
    switch (race) {
        case 'African-American':
            val = 1.0;
            break;
        case 'Asian':
            val = .8;
            break;
        case 'Caucasian':
            val = .6;
            break;
        case 'Hispanic':
            val = .4;
            break;
        case 'Native American':
            val = .2;
            break;
        default:
            val = 0;
            break;
    }
    return val;
}