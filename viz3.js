const FONT_SIZES = {
    tick: 10,
    axisTitle: 14,
    title: 20,
    markerText: 12,
    legendLabel: 10,
    lineLabel: 10
}

// color scale is here: https://github.com/d3/d3-scale-chromatic#schemeTableau10
const continentColors = d3.scaleOrdinal(d3.schemeTableau10)
                          .domain(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"]);

var parseDate = d3.timeParse("%Y-%m-%d");  // for converting strings to dates ("2020-03-31", for example)
var formatDateLong = d3.timeFormat("%b %e, %Y");  // for converting dates to strings (format is like "Mar 3, 2020")
var formatDate_yyyymmdd = d3.timeFormat("%Y-%m-%d");
var formatDateMonthDay = d3.timeFormat("%b %e");
var formatMonthYear = function (d) {
    if (d3.timeFormat("%m")(d) == "01") {
        return d3.timeFormat("%Y")(d);
    } else {
        return d3.timeFormat("%b")(d);
    }
}

var covidData;
var dataDict;

var viz3 = {
    selectedCountries: [],
    shortenTransitions: 0  // this is to allow us to speed up transitions when dragging the date slider
};

function dictRowParser(d) {
    return {
        variable_name :  d.variable_name,  // name of attribute in CSV
        data_type :      d.data_type,  // string, date, numeric, or ordinal
        display_name :   d.display_name,  // pretty name of variable, for dropdowns, titles, etc.
        sort_order :     parseInt(d.sort_order),  // when showing in dropdown menus, sort in this order
        category :       d.category,   // when grouping variables (e.g., in a summary table, these are the groupings)
        numeric_column : d.numeric_column,  // for ordinal columns, e.g., c1_school_closing, there is a corresponding "numeric" column
        larger_is :      d.larger_is  // determines whether a large value is "good", "bad", or "neutral", which determines the color scale on the map
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
        human_development_index :                      parseFloat(d.human_development_index),
        iso_code :                                     d.iso_code
    };
}

function makeDateSlider(viz, cssLocation) {
    /****************************
    * Set up date slider
    * Slider code adapted from: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
    ***************************/
    viz.dateSliderValue = 0;
    viz.dateSliderWidth = 400;

    let minDate = d3.min(covidData, d => d.date);
    let maxDate = d3.max(covidData, d => d.date);

    viz.dateXScale = d3.scaleTime()
                       .domain([minDate, maxDate])
                       .range([0, viz.dateSliderWidth])
                       .clamp(true);  // prevent dot from going off scale

    viz.svgSlider = d3.select(cssLocation)
                      .append("svg")
                          .attr("width", viz.dateSliderWidth + 100)
                          .attr("height", "100")
                          .style("vertical-align", "top")
                          .attr("transform", "translate(0, -15)")
                      .append("g")
                          .attr("class", "slider")
                          .attr("transform", "translate(50,50)");

    viz.svgSlider.append("line")
        .attr("class", "date-slider track")
        .attr("x1", viz.dateXScale.range()[0])
        .attr("x2", viz.dateXScale.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "date-slider track-inset")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "date-slider track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function () { viz.svgSlider.interrupt(); })
            .on("start drag", function (event, d) {
                viz.shortenTransitions = 100;  // shorten all transition durations to 100ms
                viz.dateSliderValue = event.x;
                dateUpdate(viz);
            })
            .on("end", function () {
                viz.shortenTransitions = 0;  // go back to normal transitions
            })
        );

    viz.svgSlider.insert("g", ".date-slider.track-overlay")
        .attr("class", "date-slider date-ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(viz.dateXScale.ticks(10))
        .enter()
        .append("text")
            .attr("x", viz.dateXScale)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .text(function (d) { return formatMonthYear(d); });
        
    // make the years in the scale bold face
    d3.selectAll(cssLocation + " .date-ticks text")
        .style("font-weight", function(d) {return (isNaN(1*formatMonthYear(d)) ? "normal" : "bolder")});


    viz.dateHandle = viz.svgSlider.insert("circle", ".date-slider.track-overlay")
                        .attr("class", "date-slider handle")
                        .attr("r", 9);

    viz.dateLabel = viz.svgSlider.append("text")
                       .attr("class", "label")
                       .attr("text-anchor", "middle")
                       .text(formatDateLong(minDate))
                       .attr("transform", "translate(0," + (-25) + ")");


    viz.playButton = d3.select(cssLocation + " .play-button");
    viz.playButton
        .on("click", function () {
            let button = d3.select(this);
            if (button.text() == "Pause") {
                clearInterval(viz.dateTimer);
                button.text("Play");
            } else {
                viz.dateTimer = setInterval(dateStep, 400, viz);
                button.text("Pause");
            }
        });
}

// function used to handle updating dates from a date slider
function dateUpdate(viz, setDate = null) {
    const newDate = setDate == null ? viz.dateXScale.invert(viz.dateSliderValue) : setDate;

    // update position and text of label according to slider scale
    viz.dateHandle.attr("cx", viz.dateXScale(newDate));
    viz.dateLabel
        .attr("x", viz.dateXScale(newDate))
        .text(formatDateLong(newDate));

    viz.selectedDate = d3.timeDay.floor(newDate);  // round down to whole day at midnight
    viz.redrawFunc();
}

// function used to move date slider forward one day
function dateStep(viz) {
    if (viz.dateSliderValue < 0) {
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


function redrawViz3() {
    const viz3Data = covidData.filter(d => (viz3.selectedCountries.includes(d.countryname) && 
                                           (d.date.getTime() == viz3.selectedDate.getTime())));

    const varMetadata = {
        'x': dataDict.filter(d => d.variable_name == viz3.selectedXAttribute)[0], 
        'y': dataDict.filter(d => d.variable_name == viz3.selectedYAttribute)[0]
    }

    // Note: if ordinal, use numeric_column attribute (e.g., c1_school_closing_numeric), otherwise use attribute as selected
    const attributeNames = {
        'x': {'name': varMetadata.x.display_name,
              'data': (varMetadata.x.data_type == "ordinal" ? varMetadata.x.numeric_column : viz3.selectedXAttribute)},
        'y': {'name': varMetadata.y.display_name,
              'data': (varMetadata.y.data_type == "ordinal" ? varMetadata.y.numeric_column : viz3.selectedYAttribute)}
    }

    // in case we removed all the data, don't show any axes or gridlines
    let axis_visibility = viz3Data.length == 0 ? "none" : "inherit";
    d3.selectAll(".viz3 .x").style("display", axis_visibility);
    d3.selectAll(".viz3 .y").style("display", axis_visibility);
    d3.selectAll(".viz3 .grid").style("display", axis_visibility);
    d3.selectAll(".viz3-legend").style("display", axis_visibility);


    /******************
    * update x and y axes
    ******************/
    function updateAxis(xOrY="x") {
        let scale, axis, axisTicks;
        if(xOrY == "x") {
            scale = viz3.xScale;
            axis = viz3.xAxis;
            axisTicks = viz3.xAxisTicks;
        } else {
            scale = viz3.yScale;
            axis = viz3.yAxis;
            axisTicks = viz3.yAxisTicks;
        }

        // see if this variable is ordinal; if it is, use its "_numeric" column
        if((varMetadata[xOrY].data_type == "ordinal")) {
            // get largest value over entire dataset, not just selection
            let maxValue = d3.max(covidData, d => (d[attributeNames[xOrY].data] > 0 ? d[attributeNames[xOrY].data] : 0));
            let ordinalValues = ["0", "1-Local", "1-National", "2-Local", "2-National", "3-Local", "3-National", "4-Local", "4-National", "5-Local", "5-National"];

            // set tick values to exactly these values
            // e.g., if maxValue = 2.5, ticks will be: 0, 0.5, 1, 1.5, 2, 2.5
            scale.domain([0, maxValue]);
            axis.tickValues(d3.range(0, maxValue + 0.5, 0.5))
                .tickFormat(d => ordinalValues[Math.floor(d * 2)]);
        } else {
            // If we're showing an aggregate index like "stringency index", always show 0 to 100.
            // Otherwise, get the maximum value for the attribute *across the whole dataset* for 
            //    the selected countries. This is because we don't want the scales to keep jumping 
            //    around for a given set of countries and making it hard to see changes.
            if (varMetadata[xOrY].category == 'aggregate indices') {
                maxValue =  100.0;
            } else {
                // Note: using viz3Data, not entire dataset. We want to see the trend at any point in time
                maxValue = d3.max(viz3Data.filter(d => viz3.selectedCountries.includes(d.countryname)),
                                    d => (d[attributeNames[xOrY].data] > 0 ? d[attributeNames[xOrY].data] : 0));
            }
            
            scale.domain([0, maxValue]);

            // if we switched from an ordinal variable, get rid of the manually specified ticks
            axis.tickValues(null).tickFormat(null);
            axisTicks.ticks(5);
        }

        d3.select(`.viz3.${xOrY}.axis`)
            .transition()
            .duration(viz3.shortenTransitions > 0 ? viz3.shortenTransitions : 300)
            .call(axis);
        
        // update axis title
        d3.select(`text.viz3.${xOrY}.axis-title`)
            .text(attributeNames[xOrY].name);

        // add the gridlines
        // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
        d3.select(`.viz3.${xOrY}.grid`)
            .call(axisTicks);

    }
    
    updateAxis("x");
    updateAxis("y");

    // rotate x-axis ticks
    d3.selectAll('.viz3.x.axis .tick text')
        .attr("transform","rotate(-45)")
        .attr("text-anchor","end");

    // set all ticks' fonts. These aren't styles/CSS, these are attributes
    d3.selectAll(".viz3.axis")
        .attr("font-size", FONT_SIZES.tick)
        .attr("font-family", "sans-serif");


    /************************
    * Create the actual points on the plot
    ************************/
    dots = viz3.svg.selectAll("circle.dot")
                .data(viz3Data, d => d.countryname);

    dots.exit()
        .transition()
        .duration(viz3.shortenTransitions > 0 ? viz3.shortenTransitions : 300)
        .style("fill-opacity", 0)
        .remove();

    dots.enter()
        .append("circle")
            .attr("r", 3.5)
            .attr("fill", d => continentColors(d.continent))
            .classed("dot", true)
            .merge(dots)
                .on("mouseover", function(event, d) {
                    const getDataText = function(xOrY="x") {
                        let dataText = d[(xOrY == "x" ? viz3.selectedXAttribute : viz3.selectedYAttribute)];
                        if(typeof dataText == "number") {
                            dataText = (isNaN(dataText) ? "No data" : Math.round(1000 * dataText) / 1000);  // round to 3 digits
                        } else {
                            dataText = (((dataText == "NA") || (dataText == "")) ? "No data" : dataText);
                        }

                        return dataText;
                    }

                    d3.select(this).classed("hover-point", true);
                    viz3.tooltip.style("display", "inline-block")
                                .html(d.countryname + "<br>" +
                                    "<b>" + attributeNames.x.name + "</b>: " + getDataText("x") + "<br>" +
                                    "<b>" + attributeNames.y.name + "</b>: " + getDataText("y"));
                }).on("mousemove", function(event, d) {
                    viz3.tooltip.style("left", event.pageX - 50 + "px")
                                .style("top", event.pageY - 70 + "px");
                }).on("mouseout", function() {
                    d3.select(this).classed("hover-point", false);
                    viz3.tooltip.style("display", "none");
                })
                .transition()
                .duration(500)
                .attr("cy", d => viz3.yScale(isNaN(d[attributeNames.y.data]) ? 0 : d[attributeNames.y.data]))
                .attr("cx", d => viz3.xScale(isNaN(d[attributeNames.x.data]) ? 0 : d[attributeNames.x.data]));
}

function makeViz3() {
    viz3.margin = {top: 20, right: 150, bottom: 90, left: 150};

    viz3.dims = {height: 400, width: 600};
    viz3.dims["innerHeight"] = viz3.dims.height - viz3.margin.top - viz3.margin.bottom
    viz3.dims["innerWidth"] = viz3.dims.width - viz3.margin.left - viz3.margin.right

    viz3.svg = d3.select("div.viz3")
                 .append("svg")
                     .attr("width", viz3.dims.width)
                     .attr("height", viz3.dims.height)
                     .attr("viewBox", `0 0 ${viz3.dims.width} ${viz3.dims.height}`)
                     .attr("preserveAspectRatio", "xMinYMin")
                     .classed("viz3", true)
                 .append("g")
                     .attr("transform", "translate(" + viz3.margin.left + "," + viz3.margin.top + ")");

    /***************
    * make y-axis
    ***************/
    viz3.yScale = d3.scaleLinear()
                    .rangeRound([viz3.dims.innerHeight - 10, 0]); // [high, low] so it plots correctly

    viz3.svg.append("g")
        .classed("viz3 y axis", true);

    viz3.yAxis = d3.axisLeft(viz3.yScale);

    // y-axis title
    d3.select("svg.viz3").append("text")
        .classed("viz3 y axis-title", true)
        .attr("transform", "translate(" + Math.floor(viz3.margin.left/2) + " ," + 
                                          Math.floor((viz3.dims.innerHeight + viz3.margin.top)/2) + ") rotate(-90)" )
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", FONT_SIZES.axisTitle);

    viz3.svg.append("g")
        .classed("viz3 y grid", true)
        .attr("transform", "translate(0,0)");

    viz3.yAxisTicks = d3.axisLeft(viz3.yScale)
                        .tickSize(-viz3.dims.innerWidth)
                        .tickFormat("");

    /***************
    * make x-axis
    ***************/
    viz3.xScale = d3.scaleLinear()
                    .rangeRound([0, viz3.dims.innerWidth]); // rangeRound ensures all pixel values are non-fractional

    viz3.svg.append("g")
        .classed("viz3 x axis", true)
        .attr("transform", "translate(0," + viz3.dims.innerHeight + ")");

    viz3.xAxis = d3.axisBottom(viz3.xScale);

    // x-axis title
    viz3.svg.append("text")
        .classed("viz3 x axis-title", true)
        .attr("transform", "translate(" + Math.floor(viz3.dims.innerWidth / 2) + " ," + 
                                          Math.floor(viz3.dims.height - 0.5 * viz3.margin.bottom) + ")")
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", FONT_SIZES.axisTitle);

    // x-axis gridlines
    // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    viz3.svg.append("g")
        .classed("viz3 x grid", true)
        .attr("transform", "translate(0," + viz3.dims.innerHeight + ")");

    viz3.xAxisTicks = d3.axisBottom(viz3.xScale)
                        .tickSize(-viz3.dims.innerHeight)
                        .tickFormat("");

    viz3.tooltip = d3.select("body")
                     .append("div")
                     .classed("viz3 tooltip", true);

    /***************
    * make continent legend
    ***************/
    let legend = viz3.svg.selectAll(".viz3-legend")
                     .data(continentColors.domain())
                     .enter()
                     .append("g")
                         .attr("class", "viz3-legend")
                         .attr("transform", function(d, i) { return "translate(150," + (i+5) * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", viz3.dims.innerWidth - 10)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", continentColors);

    // draw legend text
    legend.append("text")
        .attr("x", viz3.dims.innerWidth - 15)
        .attr("y", 5)
        .attr("dy", ".25em")
        .attr("font-family", "sans-serif")
        .attr("font-size", FONT_SIZES.legend)
        .style("text-anchor", "end")
        .text(d => d);
    
    legend.style("display", "none"); // will be displayed when there are data
}

// load the data and kick things off
Promise.all([
    d3.csv("../data/data_dictionary.csv", dictRowParser),
    d3.csv("../data/covid_data.csv", dataRowParser),
    ]).then(function(files) {
        dataDict = files[0];
        covidData = files[1];

        console.log("Imported all data!");

    /***************************
    * Countries select list. Add countries to select list and set up "change" listener to redraw
    **************************/
    selectCountry = d3.select("select#viz3-countries");

    // get unique countries, then append <option> to <select>
    Array.from(new Set(covidData.map(d => d.countryname)))
        .sort()  // put country names in order in dropdown menu
        .forEach(function(country) {
            selectCountry.append('option')
            .attr("value", country)
            .text(country);
        });

    // create listener
    selectCountry.on("change", function() {
        let countries = [];

        d3.select(this)
          .selectAll("option:checked") 
          .each(function() { countries.push(this.value) }); // for each select country, get its value (name)

        // want to maintain ordering of original selection
        viz3.selectedCountries = viz3.selectedCountries.filter(d => countries.includes(d));
        let added = countries.filter(d => !viz3.selectedCountries.includes(d));
        viz3.selectedCountries = viz3.selectedCountries.concat(added);

        redrawViz3();
    });

    
    /***************************
    * Make both attribute dropdowns. Add attributes with <optgroup> for each category, <option> for each attribute
    **************************/
    function makeAttributeDropdown(xOrY = "x") {
        const selectAttr = d3.select(`select#viz3-${xOrY}attributes`);

        // first, put categories in as optgroups
        Array.from(new Set(dataDict.filter(d => d.sort_order != 0)
                                   .map(d => d.category)))
            .forEach(function(category) {
                selectAttr.append("optgroup")
                .attr("label", category)
                .classed(`select-${xOrY}`, true);
            });
        
        // now put attributes into the optgroups
        dataDict.filter(d => d.sort_order != 0)
                .map(d => ({category : d.category, 
                            variable_name : d.variable_name,
                            display_name : d.display_name}))
                .forEach(function(attrRow, i) {
                    d3.select(`select#viz3-${xOrY}attributes optgroup.select-${xOrY}[label='${attrRow.category}']`)
                    .append("option")
                        .attr("value", attrRow.variable_name)
                        .text(attrRow.display_name)
                        .property("checked", i==0);
                });
        
        // create listener
        selectAttr.on("change", function() {
            if(xOrY == "x") {
                viz3.selectedXAttribute = d3.select(this)
                                            .select("option:checked") 
                                            .attr("value");  // want value (variable_name), not the text (display_name)
            } else {
                viz3.selectedYAttribute = d3.select(this)
                                            .select("option:checked") 
                                            .attr("value");  // want value (variable_name), not the text (display_name)
            }
            redrawViz3();
        });
    }

    makeAttributeDropdown("x");
    makeAttributeDropdown("y");

    viz3.selectedXAttribute = d3.select("select#viz3-xattributes option:checked").attr("value");
    viz3.selectedYAttribute = d3.select("select#viz3-yattributes option:checked").attr("value");


    /***************************
    * Create the viz!-------
    **************************/
    viz3.selectedDate = d3.max(covidData, d => d.date);
    makeDateSlider(viz3, "#viz3-date-slider-wrap");

    makeViz3();

    viz3.redrawFunc = redrawViz3;  // this is needed to handle timestep updates
    dateUpdate(viz3, viz3.selectedDate);  // this will kick off the redraw

    d3.selectAll(".spinner").remove();
    d3.select("#viz3-container").style("margin-left", "0");

});
