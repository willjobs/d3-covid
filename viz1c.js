// NOTE: always used classed("myclass", true) and not classed("myclass"), because the latter
// will overwrite any classes that already exist there, which may not be what you want.
const FONT_SIZES = {
    tick: 12,
    axisTitle: 14,
    title: 16,
    markerText: 12
}

// color scale is here: https://github.com/d3/d3-scale-chromatic#schemeTableau10
const continentColors = d3.scaleOrdinal(d3.schemeTableau10)
                            .domain(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"]);

var viz1c = {};  // empty object which will contain all stuff necessary for drawing/redrawing viz1c

var parseDate = d3.timeParse("%Y-%m-%d");  // for converting strings to dates ("2020-03-31", for example)
var formatDateLong = d3.timeFormat("%b %e, %Y");  // for converting dates to strings (format is like "Mar 3, 2020")
var formatDate_yyyymmdd = d3.timeFormat("%Y-%m-%d");
var formatDateMonthDay = d3.timeFormat("%b %e");
var formatMonthYear = function (d) {
    if(d3.timeFormat("%m")(d) == "01") {
        return d3.timeFormat("%Y")(d);
    } else {
        return d3.timeFormat("%b")(d);
    }
}

var covidData;
var dataDict;
var viz1cSelectedCountries = [];
var attribute;
var shortenTransitions = 0;  // this is to allow us to speed up transitions when dragging the date slider
var clicked = null;  // if a user clicks on a country, this will be a string with the country name

var theDate;

function dictRowParser(d) {
    return {
        variable_name :  d.variable_name,  // name of attribute in CSV
        data_type :      d.data_type,  // string, date, numeric, or ordinal
        display_name :   d.display_name,  // pretty name of variable, for dropdowns, titles, etc.
        sort_order :     parseInt(d.sort_order),  // when showing in dropdown menus, sort in this order
        category :       d.category,   // when grouping variables (e.g., in a summary table, these are the groupings)
        numeric_column : d.numeric_column  // for ordinal columns, e.g., c1_school_closing, there is a corresponding "numeric" column
    };
}

function dataRowParser(d) {
    return {
        countryname :                                  d.countryname,
        date :                                         parseDate(d.date),
        continent :                                    d.continent,
        new_cases :                                    parseFloat(d.new_cases),
        new_cases_per_million :                        parseFloat(d.new_cases_per_million),
        total_cases :                                  parseFloat(d.total_cases),
        total_cases_per_million :                      parseFloat(d.total_cases_per_million),
        new_deaths :                                   parseFloat(d.new_deaths),
        new_deaths_per_million :                       parseFloat(d.new_deaths_per_million),
        total_deaths :                                 parseFloat(d.total_deaths),
        total_deaths_per_million :                     parseFloat(d.total_deaths_per_million),
        new_tests :                                    parseFloat(d.new_tests),
        new_tests_per_thousand :                       parseFloat(d.new_tests_per_thousand),
        total_tests :                                  parseFloat(d.total_tests),
        total_tests_per_thousand :                     parseFloat(d.total_tests_per_thousand),
        positive_rate :                                parseFloat(d.positive_rate),
        reproduction_rate :                            parseFloat(d.reproduction_rate),
        new_vaccinations :                             parseFloat(d.new_vaccinations),
        new_vaccinations_per_hundred :                 parseFloat(d.new_vaccinations_per_hundred),
        people_vaccinated :                            parseFloat(d.people_vaccinated),
        people_vaccinated_per_hundred :                parseFloat(d.people_vaccinated_per_hundred),
        people_fully_vaccinated :                      parseFloat(d.people_fully_vaccinated),
        people_fully_vaccinated_per_hundred :          parseFloat(d.people_fully_vaccinated_per_hundred),
        icu_patients :                                 parseFloat(d.icu_patients),
        icu_patients_per_million :                     parseFloat(d.icu_patients_per_million),
        hosp_patients :                                parseFloat(d.hosp_patients),
        hosp_patients_per_million :                    parseFloat(d.hosp_patients_per_million),
        weekly_icu_admissions :                        parseFloat(d.weekly_icu_admissions),
        weekly_icu_admissions_per_million :            parseFloat(d.weekly_icu_admissions_per_million),
        weekly_hosp_admissions :                       parseFloat(d.weekly_hosp_admissions),
        weekly_hosp_admissions_per_million :           parseFloat(d.weekly_hosp_admissions_per_million),
        stringency_index :                             parseFloat(d.stringency_index),
        government_response_index :                    parseFloat(d.government_response_index),
        containment_health_index :                     parseFloat(d.containment_health_index),
        economic_support_index :                       parseFloat(d.economic_support_index),
        c1_school_closing :                            d.c1_school_closing,
        c1_school_closing_numeric :                    parseFloat(d.c1_school_closing_numeric),
        c2_workplace_closing :                         d.c2_workplace_closing,
        c2_workplace_closing_numeric :                 parseFloat(d.c2_workplace_closing_numeric),
        c3_cancel_public_events :                      d.c3_cancel_public_events,
        c3_cancel_public_events_numeric :              parseFloat(d.c3_cancel_public_events_numeric),
        c4_restrictions_on_gatherings :                d.c4_restrictions_on_gatherings,
        c4_restrictions_on_gatherings_numeric :        parseFloat(d.c4_restrictions_on_gatherings_numeric),
        c5_close_public_transport :                    d.c5_close_public_transport,
        c5_close_public_transport_numeric :            parseFloat(d.c5_close_public_transport_numeric),
        c6_stay_at_home_requirements :                 d.c6_stay_at_home_requirements,
        c6_stay_at_home_requirements_numeric :         parseFloat(d.c6_stay_at_home_requirements_numeric),
        c7_restrictions_on_internal_movement :         d.c7_restrictions_on_internal_movement,
        c7_restrictions_on_internal_movement_numeric : parseFloat(d.c7_restrictions_on_internal_movement_numeric),
        c8_international_travel_controls :             d.c8_international_travel_controls,
        c8_international_travel_controls_numeric :     parseFloat(d.c8_international_travel_controls_numeric),
        e1_income_support :                            d.e1_income_support,
        e1_income_support_numeric :                    parseFloat(d.e1_income_support_numeric),
        e2_debt_contract_relief :                      d.e2_debt_contract_relief,
        e2_debt_contract_relief_numeric :              parseFloat(d.e2_debt_contract_relief_numeric),
        e3_fiscal_measures :                           parseFloat(d.e3_fiscal_measures),
        e4_international_support :                     parseFloat(d.e4_international_support),
        h1_public_information_campaigns :              d.h1_public_information_campaigns,
        h1_public_information_campaigns_numeric :      parseFloat(d.h1_public_information_campaigns_numeric),
        h2_testing_policy :                            d.h2_testing_policy,
        h2_testing_policy_numeric :                    parseFloat(d.h2_testing_policy_numeric),
        h3_contact_tracing :                           d.h3_contact_tracing,
        h3_contact_tracing_numeric :                   parseFloat(d.h3_contact_tracing_numeric),
        h6_facial_coverings :                          d.h6_facial_coverings,
        h6_facial_coverings_numeric :                  parseFloat(d.h6_facial_coverings_numeric),
        h7_vaccination_policy :                        d.h7_vaccination_policy,
        h7_vaccination_policy_numeric :                parseFloat(d.h7_vaccination_policy_numeric),
        h4_emergency_investment_in_healthcare :        parseFloat(d.h4_emergency_investment_in_healthcare),
        h5_investment_in_vaccines :                    parseFloat(d.h5_investment_in_vaccines),
        population :                                   parseFloat(d.population),
        population_density :                           parseFloat(d.population_density),
        median_age :                                   parseFloat(d.median_age),
        aged_65_older :                                parseFloat(d.aged_65_older),
        aged_70_older :                                parseFloat(d.aged_70_older),
        gdp_per_capita :                               parseFloat(d.gdp_per_capita),
        extreme_poverty :                              parseFloat(d.extreme_poverty),
        cardiovasc_death_rate :                        parseFloat(d.cardiovasc_death_rate),
        diabetes_prevalence :                          parseFloat(d.diabetes_prevalence),
        female_smokers :                               parseFloat(d.female_smokers),
        male_smokers :                                 parseFloat(d.male_smokers),
        life_expectancy :                              parseFloat(d.life_expectancy),
        human_development_index :                      parseFloat(d.human_development_index)
    };
}

// function used to handle updating dates from a date slider

function dateUpdate(viz, setDate = null) {
    newDate = setDate == null ? viz.dateyScale.invert(viz.dateSliderValue) : setDate;

    // update position and text of label according to slider scale
    viz.dateHandle.attr("cx", viz.dateyScale(newDate));
    viz.dateLabel
        .attr("x", viz.dateyScale(newDate))
        .text(formatDateLong(newDate));

    theDate = d3.timeDay.floor(newDate);  // round down to whole day at midnight
    viz.redrawFunc();
}

// function used to move date slider forward one day
function dateStep(viz) {
    if(viz.dateSliderValue < 0) {
        viz.dateSliderValue = 0;
    }
    dateUpdate(viz);
    viz.dateSliderValue = Math.floor(viz.dateSliderValue + (viz.dateSliderWidth / 151));
    if (viz.dateSliderValue > viz.dateSliderWidth) {
        viz.dateSliderValue = 0;
        clearInterval(viz.dateTimer);
        viz.playButton.text("Play");
    }
}

function redrawViz1c() {
    // get all data for selected countries
    let viz1cData = covidData.filter(d => viz1cSelectedCountries.includes(d.countryname));

    let varMetadata = dataDict.filter(d => d.variable_name == attribute)[0];

    // if ordinal, use numeric_column attribute (e.g., c1_school_closing_numeric), otherwise use attribute as selected
    viz1c.attributeName = varMetadata.display_name;
    viz1c.attributeData = varMetadata.data_type == "ordinal" ? varMetadata.numeric_column : attribute;

    // in case we removed all the data, don't show any axes or gridlines
    let axisVisibility = viz1cData.length == 0 ? "display:none" : "display:inherit";
    d3.selectAll(".x").attr("style", axisVisibility);
    d3.selectAll(".y").attr("style", axisVisibility);
    d3.selectAll(".grid").attr("style", axisVisibility);
    d3.selectAll(".marker").attr("style", axisVisibility);
    
    viz1c.dateLine
        .attr("style", axisVisibility)
        .transition()
        .duration(shortenTransitions > 0 ? 0 : 200)  // move the line immediately if dragging the time slider
        .attr("x1", viz1c.xScale(theDate))
        .attr("x2", viz1c.xScale(theDate));
    
    viz1c.title.text(viz1c.attributeName + " over time");
    

    /******
        * update y-axis (attribute)
    ******/
    // see if this variable is ordinal; if it does, use its "_numeric" column

    if((varMetadata.data_type == "ordinal")) {
        // get largest value over entire dataset, not just selection
        let maxValue = d3.max(covidData, d => d[viz1c.attributeData]);

        // set tick values to exactly these values
        // e.g., if maxValue = 2.5, ticks will be: 0, 0.5, 1, 1.5, 2, 2.5
        viz1c.yScale.domain([0, maxValue]);
        viz1c.yAxis.tickValues(d3.range(0, maxValue + 0.5, 0.5));
    } else {
        // If we're showing an aggregate index like "stringency index", always show 0 to 100.
        // Otherwise, get the maximum value for the attribute *across the whole dataset* for 
        //    the selected countries. This is because we don't want the scales to keep jumping 
        //    around for a given set of countries and making it hard to see changes.
        if(varMetadata.category == 'aggregate indices') {
            maxValue =  100.0;
        } else{
            maxValue = d3.max(covidData.filter(d => viz1cSelectedCountries.includes(d.countryname)),
                                d => d[viz1c.attributeData]);
        }
        
        viz1c.yScale.domain([0, maxValue]);

        // if we switched from an ordinal variable, get rid of the manually specified ticks
        viz1c.yAxis.tickValues(null);
        viz1c.yAxisTicks.ticks(5);
    }

    // Update y-axis (x-axis is constant)
    d3.select(".viz1c.y.axis")
        .transition()
        .duration(shortenTransitions > 0 ? shortenTransitions : 300)
        .call(viz1c.yAxis);

    // add the Y gridlines (x-axis is constant)
    // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    d3.select(".viz1c.y.grid")
        .call(viz1c.yAxisTicks);

    // set all ticks' fonts. These aren't styles/CSS, these are attributes
    d3.selectAll(".viz1c.axis")
        .attr("font-size", FONT_SIZES.tick)
        .attr("font-family", "sans-serif");

    /***
        * TODOs:
        * - add ability to click on a line and keep the selected country in focus, with the tooltip staying on that line
    ***************/
    
    // create a "nested" structure to allow us to draw one line per country
    // see https://stackoverflow.com/a/35279106/1102199
    // "d3.nest()" is deprecated; see https://github.com/d3/d3-array/blob/master/README.md#group
    viz1c.nestedData = d3.groups(viz1cData, d => d.countryname);

    let lineGenerator = d3.line()
                            .defined(function(d) {return !isNaN(d[viz1c.attributeData])})
                            .x(d => viz1c.xScale(d.date))
                            .y(d => viz1c.yScale(d[viz1c.attributeData] >= 0 ? d[viz1c.attributeData] : 0));

    let lines = viz1c.svg.selectAll(".viz1c.line")
                    .data(viz1c.nestedData, d => d[0]);  // use the country name in d[0] as the "key" for merging later

    lines.exit()
                .transition()
                .duration(shortenTransitions > 0 ? shortenTransitions : 200)
                .style("stroke-opacity", 0)
                .remove();
    
    if(clicked && !(viz1c.nestedData.map(d => d[0]).includes(clicked))) {
        // if we had clicked on a country, but now we've changed our country selection
        // and the clicked country doesn't exist in our selection, reset the clicked state
        clicked = null;
    }

    lines.enter()
            .append("path")
                .classed("viz1c line", true)
                .attr("stroke-width", 1.5)
                .attr("fill", "none")
                .merge(lines)
                    .attr("stroke", function(d) {
                        color = continentColors(d[1][0].continent);

                        if(clicked) {
                            if(d[1][0].countryname == clicked) {
                                return color;
                            }
                            return "#ddd";
                        } else {
                            return color;
                        }
                    })  // d[1] is array of all rows for a country; d[1][0] is the first row of data in that array; we get the continent just from the first row
                    .attr("id", d => "line-" + d[0].replaceAll(" ", "-"))
                    .transition()
                    .duration(shortenTransitions > 0 ? shortenTransitions : 500)
                    .attr("d", d => lineGenerator(d[1]));
}

function makeViz1c() {
    viz1c.redrawFunc = redrawViz1c;  // need this to be able to handle timestep updates

    viz1c.margin = {top: 30, right: 40, bottom: 80, left: 80};

    viz1c.dims = {height: 500, width: d3.max([600,  // no smaller than 600px wide
                                        d3.min([700, // no larger than 900px wide
                                                Math.floor(window.innerWidth / 2)])])};
    viz1c.dims["innerHeight"] = viz1c.dims.height - viz1c.margin.top - viz1c.margin.bottom
    viz1c.dims["innerWidth"] = viz1c.dims.width - viz1c.margin.left - viz1c.margin.right

    viz1c.svg = d3.select("div.viz1c")
                    .append("svg")
                        .attr("width", viz1c.dims.width)
                        .attr("height", viz1c.dims.height)
                        .classed("viz1c", true)
                    .append("g")
                        .attr("transform", "translate(" + viz1c.margin.left + "," + viz1c.margin.top + ")");

    /***************
        * make y-axis (attribute)
    ***************/
    viz1c.yScale = d3.scaleLinear()
                    .rangeRound([viz1c.dims.innerHeight - 10, 0]); // [high, low] so it plots correctly

    viz1c.svg.append("g")
        .classed("viz1c y axis", true);

    viz1c.yAxis = d3.axisLeft(viz1c.yScale);

    /***************
    * make x-axis (date)
    ***************/
    let minDate = d3.min(covidData, d => d.date);
    let maxDate = d3.max(covidData, d => d.date);

    viz1c.xScale = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .rangeRound([0, viz1c.dims.innerWidth]);

    viz1c.xAxis = d3.axisBottom(viz1c.xScale)
                    .tickFormat(formatMonthYear);

    viz1c.svg.append("g")
        .classed("viz1c x axis", true)
        .attr("transform", "translate(0," + viz1c.dims.innerHeight + ")")
        .call(viz1c.xAxis);

    /***************
    * x-axis gridlines
    * see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    ***************/
    viz1c.xAxisGrid = d3.axisBottom(viz1c.xScale)
                        .tickSize(-viz1c.dims.innerHeight)
                        .tickFormat("");

    viz1c.svg.append("g")
        .classed("viz1c x grid", true)
        .attr("transform", "translate(0," + viz1c.dims.innerHeight + ")")
        .call(viz1c.xAxisGrid);  // X-axis gridlines shouldn't change

    /***************
        * y-axis gridlines
        * see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    ***************/
    viz1c.yAxisTicks = d3.axisLeft(viz1c.yScale)
                        .tickSize(-viz1c.dims.innerWidth)
                        .tickFormat("");

    viz1c.svg.append("g")
        .classed("viz1c y grid", true);
        // note: can't call yAxisTicks yet because it depends on data

    /***************
        * chart title
    ***************/
    viz1c.title = viz1c.svg.append("text")
        .classed("viz1c title", true)
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "start")
        .attr("transform", "translate(0, -10)")
        .style("font-size", "20px");


    // Save an array of all dates. This is necessary for our special hover effect.
    viz1c.dates = Array.from(
                    new Set(covidData.map(d => formatDate_yyyymmdd(d.date)))
                    ).sort()
                    .map(d => parseDate(d));

    /****************************
    * Set up date slider and vertical line indicating the date
    * Slider code adapted from: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    ***************************/
    viz1c.dateSliderValue = 0;
    viz1c.dateSliderWidth = 400;

    viz1c.dateyScale = d3.scaleTime()
                            .domain([minDate, maxDate])
                            .range([0, viz1c.dateSliderWidth])
                            .clamp(true);  // prevent dot from going off scale
    
    viz1c.svgSlider = d3.select("#viz1c-date-slider-wrap")
                        .append("svg")
                            .attr("width", viz1c.dateSliderWidth+100)
                            .attr("height", "100")
                            .style("vertical-align", "top")
                            .attr("transform", "translate(0, -15)")
                        .append("g")
                            .attr("class", "slider")
                            .attr("transform", "translate(50,50)");

    viz1c.svgSlider.append("line")
        .attr("class", "date-slider track")
        .attr("x1", viz1c.dateyScale.range()[0])
        .attr("x2", viz1c.dateyScale.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "date-slider track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "date-slider track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { viz1c.svgSlider.interrupt(); })
            .on("start drag", function(event, d) {
                shortenTransitions = 100;  // shorten all transition durations to 100ms
                viz1c.dateSliderValue = event.x;
                dateUpdate(viz1c); 
            })
            .on("end", function() {
                shortenTransitions = 0;  // go back to normal transitions
            })
        );
    
    viz1c.svgSlider.insert("g", ".date-slider.track-overlay")
        .attr("class", "date-slider date-ticks")
        .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
        .data(viz1c.dateyScale.ticks(10))
        .enter()
        .append("text")
        .attr("x", viz1c.dateyScale)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatMonthYear(d); });

    viz1c.dateHandle = viz1c.svgSlider.insert("circle", ".date-slider.track-overlay")
        .attr("class", "date-slider handle")
        .attr("r", 9);

    viz1c.dateLabel = viz1c.svgSlider.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDateLong(minDate))
        .attr("transform", "translate(0," + (-25) + ")");


    viz1c.playButton = d3.select("#viz1c-date-slider-wrap .play-button");
    viz1c.playButton
        .on("click", function() {
            let button = d3.select(this);
            if (button.text() == "Pause") {
                clearInterval(viz1c.dateTimer);
                button.text("Play");
            } else {
                viz1c.dateTimer = setInterval(dateStep, 400, viz1c);
                button.text("Pause");
            }
        });
    
    theDate = maxDate;

    viz1c.dateLine = viz1c.svg.append("line")
                        .classed("viz1c date-line", true)
                        .attr("stroke", "black")
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "3 3")
                        .attr("fill", "none")
                        .attr("x1", viz1c.xScale(theDate))
                        .attr("x2", viz1c.xScale(theDate))
                        .attr("y1", 0)
                        .attr("y2", viz1c.dims.innerHeight)
                        .lower();  // put the date line below the data

    dateUpdate(viz1c, maxDate);

    /**********
    * Add hover effects from https://observablehq.com/@d3/multi-line-chart
    * Define these objects and events one time rather than re-create them each time we enter reDraw
    **********/
    // these will be populated in redrawViz1c. We need to define them here so we can update the tooltip
    viz1c.nestedData = null;
    viz1c.attributeData = null;
    viz1c.attributeName = null;

    const marker = viz1c.svg.append("g")
                    .classed("viz1c marker", true)
                    .attr("display", "none");
    
    marker.append("circle")
        .attr("r", 2.5);
    
    marker.append("text")
        .classed("viz1c marker-text country", true)
        .attr("font-family", "sans-serif")
        .attr("font-size", FONT_SIZES.markerText)
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")  // right-aligned so that text doesn't go off the page
        .attr("y", -20)
        .attr("x", 5);
    
    marker.append("text")
        .classed("viz1c marker-text attribute", true)
        .attr("font-family", "sans-serif")
        .attr("font-size", FONT_SIZES.markerText)
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .attr("y", -8)
        .attr("x", 5);

    /******** 
        Idea from https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
        Key idea: We can't hover over a <g> element because it doesn't detect mouse movements, only svg elements do.
                    So, we add a g element at the end of the svg (so it's on top of all the other elements in the svg),
                    and fill it with a rectangle shifted to match the visualization <g>.
    ********/

    d3.select("svg.viz1c")
        .append("g")
            .attr("transform", "translate(" + viz1c.margin.left + "," + viz1c.margin.top + ")")
            .attr("class", "mouse-over-effects")
        .append('rect')
            .attr('width', viz1c.dims.innerWidth)
            .attr('height', viz1c.dims.innerHeight)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
        .on("mouseenter", function() {
            marker.attr("display", null);
        }).on("mouseleave", function() {
            marker.attr("display", "none");
            
            if(!clicked) {
                viz1c.svg.selectAll(".viz1c.line")
                    .attr("stroke", d => continentColors(d[1][0].continent))
                    .classed("hover-line", false);
            }
        }).on("click", function () {
            if(clicked) {  // undo the click if we're already clicked
                clicked = null; 
                return;
            }
            clicked = viz1c.svg.selectAll(".hover-line");
            if(clicked.node()) {  // check that the hover is activated before trying to get its value
                clicked = clicked.datum()[0];  // get the country name for the highlighted line
                //console.log(clicked);
            }
        }).on("mousemove", function() {
            event.preventDefault();

            if(clicked && !(viz1c.nestedData.map(d => d[0]).includes(clicked))) {
                // if we had clicked on a country, but now we've changed our country selection
                // and the clicked country doesn't exist in our selection, reset the clicked state
                clicked = null;
            }

            let pointer = d3.pointer(event, this);  // get x,y position of pointer
            let xm = viz1c.xScale.invert(pointer[0]);  // get date value associated with x position
            let ym = viz1c.yScale.invert(pointer[1]); // get attribute value associated with y position

            // if outside the plot area, exit
            if(xm < d3.min(viz1c.dates)) {return;}

            let nearestDate = viz1c.dates[d3.bisectCenter(viz1c.dates, xm)];  // get the nearest date corresponding to the x-position of the mouse

            // filter to data associated with nearest date
            let data = viz1c.nestedData.map(function(d) {
                            // each element of outermost array (1 per country)
                            const rows = d[1].filter(function(d2) {
                                // each element of a country's array
                                return d2.date.getTime() == nearestDate.getTime();
                            });
                            return rows;
                        });
            if(data.length == 0) {return;}

            // get row for country with nearest attribute value on this date
            // exception: if we're in the "clicked" state, get the selected country's values
            let closestCountryRow;
            if(!clicked) {
                closestCountryRow = d3.least(data, function(d) {
                                                            const value = (isNaN(d[0][viz1c.attributeData]) ? 999999 : d[0][viz1c.attributeData]);
                                                            return Math.abs(ym - value);
                                                        })[0];
            } else {
                closestCountryRow = d3.filter(data, d => d[0].countryname == clicked)[0][0];
            }

            let closestValue = (isNaN(closestCountryRow[viz1c.attributeData]) ? 0 : closestCountryRow[viz1c.attributeData]);

            // for the non-active lines, set them to light gray. For the active/hovered line, leave its stroke as the default blue
            viz1c.svg.selectAll(".viz1c.line")
                .attr("stroke", function(d) {
                    if(d[0] == closestCountryRow.countryname) {return continentColors(d[1][0].continent);}
                    return "#ddd";
                }).classed("hover-line", d => d[0] == closestCountryRow.countryname);
            
            // adjust marker text alignment to avoid text going off the svg
            // if x-coordinate is in right 25% of SVG, make tooltips right-aligned; otherwise left-aligned
            // if y-coordinate *of marker* is in top 10% of SVG, put tooltips *below* the cursor; otherwise above
            let markerTextAlign = (pointer[0] > viz1c.xScale.range()[1] * 0.75 ? "end" : "start");
            let markerX = (pointer[0] > viz1c.xScale.range()[1] * 0.75 ? -5 : 5);

            d3.selectAll(".marker-text")
                .attr("text-anchor", markerTextAlign)
                .attr("x", markerX);
            
            // since there are two textboxes with different y positions, we need to update one at a time
            // we also want to make sure that country is on top
            if (viz1c.yScale(closestValue) < viz1c.yScale.range()[0] * 0.1) {
                d3.selectAll(".marker-text.country").attr("y", 8);
                d3.selectAll(".marker-text.attribute").attr("y", 20);
            } else {
                d3.selectAll(".marker-text.country").attr("y", -20);
                d3.selectAll(".marker-text.attribute").attr("y", -8);
            }

            // move the marker to the appropriate location on the line
            marker.attr("transform", `translate(${viz1c.xScale(nearestDate)}, ${viz1c.yScale(closestValue)})`);
            marker.select("text.marker-text.country").text(closestCountryRow.countryname + ' (' + formatDateMonthDay(nearestDate) + ")");
            marker.select("text.marker-text.attribute").text(viz1c.attributeName + ": " + closestCountryRow[viz1c.attributeData]);
            marker.raise();  // ensures that the text is always readable over the lines
        });
}

// load the data and kick things off
Promise.all([
    d3.csv("../data/data_dictionary.csv", dictRowParser),
    d3.csv("../data/covid_data.csv", dataRowParser),
    //d3.csv("../data/covid_oxford+owid_20210414-185830.csv", dataRowParser),
]).then(function(files) {
    dataDict = files[0];
    covidData = files[1];

    console.log("Imported all data!");

    /***************************
    * Countries select list. Add countries to select list and set up "change" listener to redraw
    **************************/
    selectCountry = d3.select("select#viz1-countries");

    // get unique countries, then append <option> to <select>
    Array.from(new Set(covidData.map(d => d.countryname)))
        .sort()  // put country names in order in dropdown menu
        .forEach(function(country) {
            selectCountry.append('option')
                .attr("value", country)
                .text(country);
        });

    // create listener
    selectCountry
        .on("change", function() {
            let countries = [];

            selected = d3.select(this)
                .selectAll("option:checked") 
                .each(function() { countries.push(this.value) }); // for each select country, get its value (name)

            // want to maintain ordering of original selection
            viz1cSelectedCountries = viz1cSelectedCountries.filter(d => countries.includes(d));
            added = countries.filter(d => !viz1cSelectedCountries.includes(d));
            viz1cSelectedCountries = viz1cSelectedCountries.concat(added);

            redrawViz1c();
        });

    
    /***************************
    * Attributes dropdown. Add attributes with <optgroup> for each category, <option> for each attribute
    **************************/
    //add attributes to the attribute dropdown menu;
    selectAttr = d3.select("select#viz1-attributes");

    // first, put categories in as optgroups
    Array.from(new Set(dataDict.filter(d => d.sort_order != 0)
                                .map(d => d.category)))
        .forEach(function(category) {
            selectAttr.append("optgroup")
                .attr("label", category);
        });
    
    // now put attributes into the optgroups
    dataDict.filter(d => d.sort_order != 0)
            .map(d => ({category : d.category, 
                        variable_name : d.variable_name,
                        display_name : d.display_name}))
            .forEach(function(attrRow, i) {
                d3.select("optgroup[label='" + attrRow.category + "']")
                    .append("option")
                    .attr("value", attrRow.variable_name)
                    .text(attrRow.display_name);
                
                // initialize attribute to first row in data dictionary
                if(i == 0) {attribute = attrRow.variable_name;}
            });
    
    // create listener
    selectAttr
        .on("change", function() {
            attribute = d3.select(this)
                            .select("option:checked") 
                            .attr("value");  // want value (variable_name), not the text (display_name)
            redrawViz1c();
        });
    
    /***************************
    * Create the viz!
    **************************/
    makeViz1c();
    redrawViz1c();
    d3.selectAll(".spinner").remove();

}).catch(function(err) {
    d3.selectAll(".spinner").remove();
    console.error('Error: ' + err);
})