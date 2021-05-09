const FONT_SIZES = {
    tick: 10,
    axisTitle: 14,
    title: 20,
    markerText: 12,
    legendLabel: 10,
    lineLabel: 10
};

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
};

var covidData;
var dataDict;
var geomData;
var minDate;
var maxDate;


// these properties apply to all 3 parts of viz1
var viz1 = {
    selectedCountries: [],
    scaleMaxToDate: false,  // if false, set scales' maxes to the max over whole timeframe; if true, set max to just values observed on selected date
    quantileColor: false,    // if true, use scaleSequentialQuantile for colors; if false, use scaleSequential
    shortenTransitions: 0  // this is to allow us to speed up transitions when dragging the date slider
};

// these are specific to viz 1a, 1b, and 1c
var viz1a = {};  
var viz1b = {};
var viz1c = {
    clicked: null  // if a user clicks on a country, this will be a string with the country name
};

var viz2 = {};

var viz3 = {
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
        .style("font-weight", function(d) {return (isNaN(1*formatMonthYear(d)) ? "normal" : "bolder");});


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

function redrawViz1a() {
    const viz1aData = covidData.filter(d => d.date.getTime() == viz1.selectedDate.getTime());
    const varMetadata = dataDict.filter(d => d.variable_name == viz1.selectedAttribute)[0];
    const attributeName = varMetadata.display_name;

    viz1a.title.text(attributeName + " among countries on " + formatDateLong(viz1.selectedDate));

    if(varMetadata.data_type == "ordinal") {
        // uncheck and disable both checkboxes for ordinal variables
        viz1.quantileColor = false;
        d3.select("input[name='viz1-quantile-checkbox']").property("checked", false);

        viz1.scaleMaxToDate = false;
        d3.select("input[name='viz1-scale-checkbox']").property("checked", false);

        d3.selectAll(".viz1.checkbox-container").style("display","none");
    } else {
        d3.selectAll(".viz1.checkbox-container").style("display","inline-block");
    }

    /******
    * update legend and colors in map
    ******/
    let colorScale;  // this is used to decide which color scale to use for the legend
    let colorPalette;
    let ordinalValues = [];

    if(varMetadata.larger_is == "good") {
        colorPalette = (varMetadata.data_type == "ordinal" ? d3.schemeYlGn : d3.interpolateYlGn);
    } else if(varMetadata.larger_is == "bad") {
        colorPalette = (varMetadata.data_type == "ordinal" ? d3.schemeYlOrBr : d3.interpolateYlOrBr);
    } else {  // neutral
        colorPalette = (varMetadata.data_type == "ordinal" ? d3.schemePurples : d3.interpolatePurples);
    }

    if (varMetadata.data_type == "ordinal") {
        // get possible values, using the text version of attribute (1-Local, 1-National, etc.)
        ordinalValues = Array.from(new Set(covidData.map(d => (((d[viz1.selectedAttribute] === "NA") || (d[viz1.selectedAttribute] === "")) ? "0" : d[viz1.selectedAttribute]) ))).sort();
        colorScale = d3.scaleOrdinal(colorPalette[ordinalValues.length]).domain(ordinalValues);  // note: the max # of colors for this color scale is 9
    } else if (viz1.quantileColor) {
        colorScale = d3.scaleSequentialQuantile(colorPalette)
                        .domain(viz1aData.map(d => (d[viz1.selectedAttribute] < 0 ? 0 : d[viz1.selectedAttribute])));
    } else {
        let maxValue;

        if ((!viz1.scaleMaxToDate) && (varMetadata.category == "aggregate indices")) {
            maxValue = 100.0;
        } else {
            // if scaling to just today, use the filtered data in viz1aData, otherwise use all data in covidData
            maxValue = d3.max((viz1.scaleMaxToDate ? viz1aData : covidData), d => d[viz1.selectedAttribute]);
            maxValue = maxValue > 0 ? maxValue : 0;
        }

        colorScale = d3.scaleSequential(colorPalette).domain([0, maxValue]);
    }

    const legendHeight = varMetadata.data_type == "ordinal" ? (25 * ordinalValues.length) : 50;

    d3.selectAll(".viz1a.legend").remove();  // if it already exists, remove it and replace it
    const mapDiv = d3.select("#map")
                     .append("div")  // this ensures it doesn't move with the map when we drag it
                         .classed("viz1a legend", true)
                         .style("position", "relative")
                         .style("z-index", 99999)  // this plus the position:relative makes it appear on top
                         .style("pointer-events", "none");  // this ensures we don't block the mouseovers, clicks, etc

    if(colorScale.domain().length > 0) {
        mapDiv.append(() => legend({
            color: colorScale,
            title: attributeName,
            width: varMetadata.data_type == "ordinal" ? 25 : 200,
            height: legendHeight,
            ticks: 4,
            tickFormat: ".0f"
        }));

        const legendTop = viz1a.svg.attr("height") - 150 - (varMetadata.data_type != "ordinal" ? 
                                                            0 : 
                                                            ordinalValues.length * d3.select(".legend rect").attr("height"));

        d3.select("#map .legend svg")
            .style("position", "relative")
                .style("top", legendTop + "px")
                .style("left", 20 + "px");
    }

    d3.selectAll("#map .tick text").style("font-size", FONT_SIZES.legendLabel + "px");
    d3.select("#map .legend-title").style("font-size", FONT_SIZES.axisTitle + "px");

    // bind data to each path
    d3.selectAll("#map path[class^='shape-']")
        .data(viz1aData, function (d) {
            return d ? d.iso_code : d3.select(this).attr("class").match(/(?<=shape-)[A-Z]{3}/)[0];
        }).on("mouseover", function (event, d) {
            d3.select(this).classed("hover-country", true);

            let dataText = d[viz1.selectedAttribute];
            if(typeof dataText == "number") {
                dataText = (isNaN(dataText) ? "No data" : (Math.round(1000 * dataText) / 1000).toLocaleString());  // round to 3 digits
            } else {
                dataText = (dataText == "NA" ? "No data" : dataText);
            }

            viz1a.tooltip.style("display", "inline-block")
                         .html((d.countryname) + "<br><b>" + attributeName + "</b>: " + dataText);
        }).on("mousemove", function (event, d) {
            viz1a.tooltip.style("left", (event.pageX < 50 ? 0 : event.pageX - 50) + "px")
                         .style("top", event.pageY < 70 ? 0 : event.pageY - 70 + "px");
        }).on("mouseout", function () {
            d3.select(this).classed("hover-country", false);
            viz1a.tooltip.style("display", "none");
        }).on("click", function (event, d) {
            let country = d.countryname;

            if (event.ctrlKey) {
                // add this country to the selection if it's not there. If it is there, remove it.
                if (!viz1.selectedCountries.includes(country)) {
                    viz1.selectedCountries.push(country);
                    d3.select(this).classed("selected-country", true);
                    d3.select("#map .selected-country")
                        .classed("selected-country", false)
                        .classed("selected-country", true);
                } else {
                    viz1.selectedCountries = viz1.selectedCountries.filter(d => d != country);
                    d3.select(this).classed("selected-country", false);
                }
            } else {
                if (viz1.selectedCountries.length > 0) {
                    // if the clicked country was already in the list, clear out the entire list
                    // if the clicked country was not in the list, clear the list and put this country in
                    const includedCountry = viz1.selectedCountries.includes(country);
                    viz1.selectedCountries = [];
                    d3.selectAll("#map .selected-country").classed("selected-country", false);

                    if (!includedCountry) {
                        viz1.selectedCountries.push(country);
                        d3.select(this).classed("selected-country", true);
                    }
                } else {
                    viz1.selectedCountries.push(country);
                    d3.select(this).classed("selected-country", true);
                }
            }

            // selection changed: re-draw!
            redrawViz1b();
            redrawViz1c();
            redrawViz2();
        }).transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 200)
        .attr("fill", function (d) {
            let val;

            if(varMetadata.data_type == "ordinal") {
                val = (((d[viz1.selectedAttribute] === "NA") || (d[viz1.selectedAttribute] === "")) ? "0" : d[viz1.selectedAttribute]);
            } else {
                val = (d[viz1.selectedAttribute] > 0 ? d[viz1.selectedAttribute] : 0);
            }
            return (colorScale.domain().length > 0 ? colorScale(val) : "rgb(255, 255, 229)");
        });
}

function redrawViz1b() {
    const viz1bData = covidData.filter(d => viz1.selectedCountries.includes(d.countryname) &&
                                            (d.date.getTime() == viz1.selectedDate.getTime()));
    const varMetadata = dataDict.filter(d => d.variable_name == viz1.selectedAttribute)[0];

    // if ordinal, use numeric_column attribute (e.g., c1_school_closing_numeric), otherwise use attribute as selected
    const attributeName = varMetadata.display_name;
    const attributeData = (varMetadata.data_type == "ordinal" ? varMetadata.numeric_column : viz1.selectedAttribute);

    // in case we removed all the data, don't show any axes or gridlines
    const axisVisibility = viz1bData.length == 0 ? "none" : "inherit";
    d3.selectAll(".viz1b .x").style("display", axisVisibility);
    d3.selectAll(".viz1b .y").style("display", axisVisibility);
    d3.selectAll(".viz1b .grid").style("display", axisVisibility);
    d3.selectAll("div.viz1-continents").style("display", axisVisibility);

    /******
    * update y-axis
    ******/
    // Doing it this way so that we can maintain the order in which the user selected countries
    viz1b.yScale.domain(viz1.selectedCountries);

    d3.select(".viz1b.y.axis")
        .transition()
        .duration(500)
        .call(viz1b.yAxis);

    // remove y-axis ticks and vertical black line
    d3.selectAll(".viz1b.y.axis .tick line").remove();
    d3.selectAll(".viz1b.y.axis path").remove();

    /******
    * update x-axis
    ******/
    // see if this variable is ordinal; if it is, use its "_numeric" column
    let maxValue;

    if ((varMetadata.data_type == "ordinal")) {
        // get largest value over entire dataset, not just selection
        maxValue = d3.max(covidData, d => (d[attributeData] > 0 ? d[attributeData] : 0));
        let ordinalValues = ["0", "1-Local", "1-National", "2-Local", "2-National", "3-Local", "3-National", "4-Local", "4-National", "5-Local", "5-National"];

        // set tick values to exactly these values
        // e.g., if maxValue = 2.5, ticks will be: 0, 0.5, 1, 1.5, 2, 2.5
        viz1b.xScale.domain([0, maxValue]);
        viz1b.xAxis
            .tickValues(d3.range(0, maxValue + 0.5, 0.5))
            .tickFormat(d => ordinalValues[Math.floor(d * 2)]);
    } else {
        // If we're showing an aggregate index like "stringency index", always show 0 to 100.
        // Otherwise, get the maximum value for the attribute *across the whole dataset* for 
        //    the selected countries. This is because we don't want the scales to keep jumping 
        //    around for a given set of countries and making it hard to see changes.
        if ((!viz1.scaleMaxToDate) && (varMetadata.category == "aggregate indices")) {
            maxValue = 100.0;
        } else {
            const dataset = (viz1.scaleMaxToDate ? viz1bData : covidData);
            maxValue = d3.max(dataset.filter(d => viz1.selectedCountries.includes(d.countryname)),
                              d => (d[attributeData] > 0 ? d[attributeData] : 0));
        }

        viz1b.xScale.domain([0, maxValue]);

        // if we switched from an ordinal variable, get rid of the manually specified ticks
        viz1b.xAxis.tickValues(null).tickFormat(null);
        viz1b.xAxisTicks.ticks(5);
    }

    d3.select(".viz1b.x.axis")
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 300)
        .call(viz1b.xAxis);

    // add the X gridlines
    // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    d3.select(".viz1b.grid")
        .call(viz1b.xAxisTicks);

    // set all ticks' fonts. These aren't styles/CSS, these are attributes
    d3.selectAll(".viz1b.axis")
        .attr("font-size", FONT_SIZES.tick)
        .attr("font-family", "sans-serif");

    // rotate x-axis ticks
    d3.selectAll('.viz1b.x.axis .tick text')
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end");

    // Create the bars: there will be one with the actual data, and one that is invisible
    // which extends the length of the chart and activates the hover effect
    let bars = viz1b.svg.selectAll("rect.data")
                    .data(viz1bData, d => d.countryname);

    bars.exit()
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 300)
        .style("fill-opacity", 0)
        .remove();

    bars.enter()
        .append("rect")
            .attr("fill", d => continentColors(d.continent))
            .classed("viz1b bar data", true)
            .attr("id", function (d, i) { return "viz1b-bar" + i; })
        .merge(bars)
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .attr("y", d => viz1b.yScale(d.countryname))
            .attr("height", viz1b.yScale.bandwidth())
            .attr("width", d => viz1b.xScale((d[attributeData] > 0 ? d[attributeData] : 0)));

    /**********************
    * use "invisible" bars to allow hovering even over very small values
    ***********************/
    let invisibleBars = viz1b.svg.selectAll("rect.invisible")
                             .data(viz1bData, d => d.countryname);

    invisibleBars.exit()
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 300)
        .style("fill-opacity", 0)
        .remove();

    invisibleBars.enter()
        .append("rect")
            .attr("fill-opacity", "0.05")
            .classed("viz1b bar invisible", true)
        .merge(invisibleBars)
            .on("mouseover", function (event, d) {
                d3.select(this).classed("hover-bar", true);

                let dataText = d[viz1.selectedAttribute];
                if(typeof dataText == "number") {
                    dataText = (isNaN(dataText) ? "No data" : (Math.round(1000 * dataText) / 1000).toLocaleString());  // round to 3 digits
                } else {
                    dataText = (((dataText === "NA") || (dataText === "")) ? "No data" : dataText);
                }

                viz1b.tooltip
                     .style("display", "inline-block")
                     // note: display attributeName's value, not attributeData, because we want to see the categorical value, not numeric version
                     // Also, don't show NaN or "NA". If no data, write "No data"
                     .html((d.countryname) + "<br><b>" + attributeName + "</b>: " + dataText);
            }).on("mousemove", function (event, d) {
                viz1b.tooltip.style("left", event.pageX - 50 + "px")
                             .style("top", event.pageY - 70 + "px");
            }).on("mouseout", function () {
                d3.select(this).classed("hover-bar", false);
                viz1b.tooltip.style("display", "none");
            })
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .attr("y", d => viz1b.yScale(d.countryname))
            .attr("height", viz1b.yScale.bandwidth())
            .attr("width", d => viz1b.xScale(viz1b.xScale.domain()[1]));

    /**********************
    * Add a text label specifying "No data" when a country doesn't have any data (to differentiate it from 0)
    **********************/
    let noData = viz1b.svg.selectAll("text.no-data")
                          .data(viz1bData, d => d.countryname);

    noData.exit()
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 300)
        .style("fill-opacity", 0)
        .remove();

    noData.enter()
        .append("text")
            .classed("viz1b no-data", true)
            .attr("id", function (d, i) { return "viz1b-nodata" + i; })
        .merge(noData)
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .attr("y", d => viz1b.yScale(d.countryname) + 0.5 * viz1b.yScale.bandwidth())
            .attr("dy", "0.3em")
            .style("visibility", d => ((isNaN(d[attributeData]) || (d[attributeData] === "NA") || (d[attributeData] === "")) ? "visible" : "hidden"))
            .text(d => ((isNaN(d[attributeData]) || (d[attributeData] === "NA") || (d[attributeData] === "")) ? "No data" : ""));
}

function redrawViz1c() {
    // get all data for selected countries
    const viz1cData = covidData.filter(d => viz1.selectedCountries.includes(d.countryname));
    const varMetadata = dataDict.filter(d => d.variable_name == viz1.selectedAttribute)[0];

    // if ordinal, use numeric_column attribute (e.g., c1_school_closing_numeric), otherwise use attribute as selected
    // these are defined as object attributes so that we can define the hover effects in makeViz1c
    viz1c.attributeName = varMetadata.display_name;
    viz1c.attributeData = varMetadata.data_type == "ordinal" ? varMetadata.numeric_column : viz1.selectedAttribute;

    // in case we removed all the data, don't show any axes or gridlines
    const axisVisibility = (viz1cData.length == 0 ? "none" : "inherit");
    d3.selectAll(".viz1c .x").style("display", axisVisibility);
    d3.selectAll(".viz1c .y").style("display", axisVisibility);
    d3.selectAll(".viz1c .grid").style("display", axisVisibility);

    viz1c.dateLine
        .style("display", axisVisibility)
        .transition()
        .duration(viz1.shortenTransitions > 0 ? 0 : 200)  // move the line immediately if dragging the time slider
        .attr("x1", viz1c.xScale(viz1.selectedDate))
        .attr("x2", viz1c.xScale(viz1.selectedDate));

    /******
    * update y-axis (attribute)
    ******/
    // see if this variable is ordinal; if it is, use its "_numeric" column
    let maxValue;

    if (varMetadata.data_type == "ordinal") {
        // get largest value over entire dataset, not just selection
        maxValue = d3.max(covidData, d => (d[viz1c.attributeData] > 0 ? d[viz1c.attributeData] : 0));
        let ordinalValues = ["0", "1-Local", "1-National", "2-Local", "2-National", "3-Local", "3-National", "4-Local", "4-National", "5-Local", "5-National"];

        // set tick values to exactly these values
        // e.g., if maxValue = 2.5, ticks will be: 0, 0.5, 1, 1.5, 2, 2.5
        viz1c.yScale.domain([0, maxValue]);
        viz1c.yAxis
            .tickValues(d3.range(0, maxValue + 0.5, 0.5))
            .tickFormat(d => ordinalValues[Math.floor(d * 2)]);
    } else {
        // If we're showing an aggregate index like "stringency index", always show 0 to 100.
        // Otherwise, get the maximum value for the attribute *across the whole dataset* for 
        //    the selected countries. This is because we don't want the scales to keep jumping 
        //    around for a given set of countries and making it hard to see changes.
        if (varMetadata.category == 'aggregate indices') {
            maxValue = 100.0;
        } else {
            maxValue = d3.max(covidData.filter(d => viz1.selectedCountries.includes(d.countryname)),
                              d => (d[viz1c.attributeData] > 0 ? d[viz1c.attributeData] : 0));
        }

        viz1c.yScale.domain([0, maxValue]);

        // if we switched from an ordinal variable, get rid of the manually specified ticks
        viz1c.yAxis.tickValues(null).tickFormat(null);
        viz1c.yAxisTicks.ticks(5);
    }

    // Update y-axis (x-axis is constant)
    d3.select(".viz1c.y.axis")
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 300)
        .call(viz1c.yAxis);

    // add the Y gridlines (x-axis is constant)
    // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    d3.select(".viz1c.y.grid")
        .call(viz1c.yAxisTicks);
    
    // rotate x-axis ticks
    d3.selectAll('.viz1c.x.axis .tick text')
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end");

    // set all ticks' fonts. These aren't styles/CSS, these are attributes
    d3.selectAll(".viz1c.axis")
        .attr("font-size", FONT_SIZES.tick)
        .attr("font-family", "sans-serif");

    // create a "nested" structure to allow us to draw one line per country
    // see https://stackoverflow.com/a/35279106/1102199
    // "d3.nest()" is deprecated; see https://github.com/d3/d3-array/blob/master/README.md#group
    viz1c.nestedData = d3.groups(viz1cData, d => d.countryname);

    let lineGenerator = d3.line()
        .defined(function (d) { return !isNaN(d[viz1c.attributeData]); })
        .x(d => viz1c.xScale(d.date))
        .y(d => viz1c.yScale(d[viz1c.attributeData] > 0 ? d[viz1c.attributeData] : 0));

    let lines = viz1c.svg.selectAll(".viz1c.line")
                     .data(viz1c.nestedData, d => d[0]);  // use the country name in d[0] as the "key" for merging later
    
    let labels = viz1c.svg.selectAll(".viz1c.line-label")
                      .data(viz1c.nestedData, d => d[0]);

    lines.exit()
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 200)
        .style("stroke-opacity", 0)
        .remove();

    labels.exit()
        .transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 200)
        .style("fill-opacity", 0)
        .remove();

    if (viz1c.clicked && !(viz1c.nestedData.map(d => d[0]).includes(viz1c.clicked))) {
        // if we had clicked on a country, but now we've changed our country selection
        // and the clicked country doesn't exist in our selection, reset the clicked state
        viz1c.clicked = null;
    }

    lines.enter()
        .append("path")
            .classed("viz1c line", true)
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
        .merge(lines)
            .attr("stroke", function (d) {
                const color = continentColors(d[1][0].continent);

                if (viz1c.clicked) {
                    if (d[1][0].countryname == viz1c.clicked) {
                        return color;
                    }
                    return "#ddd";
                } else {
                    return color;
                }
            })  // d[1] is array of all rows for a country; d[1][0] is the first row of data in that array; we get the continent just from the first row
            .attr("id", d => "line-" + d[0].replaceAll(" ", "-"))
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .attr("d", d => lineGenerator(d[1]));

    labels.enter()
        .append("text")
            .classed("viz1c line-label", true)
            .attr("font-size", FONT_SIZES.lineLabel)
        .merge(labels)
            .text(d => d[0])    
            .attr("x", viz1c.dims.innerWidth + 5)
            .attr("stroke", function (d) {
                const color = continentColors(d[1][0].continent);

                if (viz1c.clicked) {
                    if (d[1][0].countryname == viz1c.clicked) {
                        return color;
                    }
                    return "#ddd";
                } else {
                    return color;
                }
            })  // d[1] is array of all rows for a country; d[1][0] is the first row of data in that array; we get the continent just from the first row
            .attr("stroke-width", 0.75)
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .style("fill-opacity", 1)
            .attr("y", function(d) {
                const lastValue = d[1].slice(-1)[0][viz1c.attributeData];
                return viz1c.yScale(lastValue > 0 ? lastValue : 0);
            });
}

function redrawViz1All() {
    redrawViz1a();
    redrawViz1b();
    redrawViz1c();
}

function redrawViz2() {
    let viz2Data = covidData.filter(d => (viz1.selectedCountries.includes(d.countryname) 
                                          && (d.date.getTime() == maxDate.getTime())));  // table only shows latest data
    if(viz2Data.length == 0) {
        d3.select("div.viz2").style("display","none");
        return;
    } else {
        d3.select("div.viz2").style("display","inherit");
    }

    // replace the table we're updating
    d3.select(".viz2-table table").remove();
    const table = d3.select(".viz2-table").append("table");

    const WIDTH_PER_COUNTRY_COL = 125;
    const WIDTH_ATTRIBUTE_COL = 200;
    table.attr("width", WIDTH_ATTRIBUTE_COL + viz1.selectedCountries.length * WIDTH_PER_COUNTRY_COL);

    // append the header row. First column = "attribute", then one column per country
    const headerRow = table.append("thead").append("tr");
    headerRow.append("th")
             .text("Attribute")
             .attr("width", WIDTH_ATTRIBUTE_COL);

    viz1.selectedCountries.forEach(function(country) {
        headerRow.append("th")
                 .text(country)
                 .attr("width", WIDTH_PER_COUNTRY_COL);
    });

    // add the data rows. First cell in each row is the attribute, the remaining cells are the countries' values
    const tbody = table.append("tbody");

    dataDict.filter(d => d.category == viz2.selectedCategory)
            .forEach(function(attribute) {
                const tr = tbody.append("tr");

                tr.classed("selected-row", attribute.variable_name == viz1.selectedAttribute)
                  .append("td").text(attribute.display_name);
                
                // make a hashmap/dictionary from country --> attribute value
                const attributeMap = viz2Data.reduce(
                    function(map, obj) {
                        map[obj.countryname] = obj[attribute.variable_name]; 
                        return map;
                }, {});

                // add each country's value, in order of appearance
                // round numeric values to 3 decimal places, and replace "NAN" or "NA" with "No data"
                viz1.selectedCountries.forEach(function(country) {
                    let valText = attributeMap[country];
                    if(typeof valText == "number") {
                        valText = (isNaN(valText) ? "No data" : (Math.round(1000 * valText) / 1000).toLocaleString()); // round to nearest 3 decimal places
                    } else {
                        valText = (((valText === "NA") || (valText === "")) ? "No data" : valText);
                    }

                    tr.append("td").text(valText);
                });
            });
}

function redrawViz3() {
    const viz3Data = covidData.filter(d => (d.date.getTime() == viz3.selectedDate.getTime()));

    const varMetadata = {
        'x': dataDict.filter(d => d.variable_name == viz3.selectedXAttribute)[0], 
        'y': dataDict.filter(d => d.variable_name == viz3.selectedYAttribute)[0]
    };

    // Note: if ordinal, use numeric_column attribute (e.g., c1_school_closing_numeric), otherwise use attribute as selected
    const attributeNames = {
        'x': {'name': varMetadata.x.display_name,
              'data': (varMetadata.x.data_type == "ordinal" ? varMetadata.x.numeric_column : viz3.selectedXAttribute)},
        'y': {'name': varMetadata.y.display_name,
              'data': (varMetadata.y.data_type == "ordinal" ? varMetadata.y.numeric_column : viz3.selectedYAttribute)}
    };

    // in case we removed all the data, don't show any axes or gridlines
    let axis_visibility = viz3Data.length == 0 ? "none" : "inherit";
    d3.selectAll(".viz3 .x").style("display", axis_visibility);
    d3.selectAll(".viz3 .y").style("display", axis_visibility);
    d3.selectAll(".viz3 .grid").style("display", axis_visibility);
    d3.selectAll(".viz3-legend").style("display", axis_visibility);


    /******************
    * update x and y axes
    ******************/
    const updateAxis = function(xOrY="x") {
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
        let maxValue;

        if((varMetadata[xOrY].data_type == "ordinal")) {
            // get largest value over entire dataset, not just selection
            maxValue = d3.max(covidData, d => (d[attributeNames[xOrY].data] > 0 ? d[attributeNames[xOrY].data] : 0));
            let ordinalValues = ["0", "1-Local", "1-National", "2-Local", "2-National", "3-Local", "3-National", "4-Local", "4-National", "5-Local", "5-National"];

            // set tick values to exactly these values
            // e.g., if maxValue = 2.5, ticks will be: 0, 0.5, 1, 1.5, 2, 2.5
            scale.domain([0, maxValue]);
            axis.tickValues(d3.range(0, maxValue + 0.5, 0.5))
                .tickFormat(d => ordinalValues[Math.floor(d * 2)]);
        } else {
            // If we're showing an aggregate index like "stringency index", always show 0 to 100.
            if (varMetadata[xOrY].category == 'aggregate indices') {
                maxValue =  100.0;
            } else {
                // Note: using viz3Data, not entire dataset. We want to see the trend at any point in time
                maxValue = d3.max(viz3Data, d => (d[attributeNames[xOrY].data] > 0 ? d[attributeNames[xOrY].data] : 0));
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

    };
    
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
    const dots = viz3.svg.selectAll("circle.dot")
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
                            dataText = (isNaN(dataText) ? "No data" : (Math.round(1000 * dataText) / 1000).toLocaleString());  // round to 3 digits
                        } else {
                            dataText = (((dataText === "NA") || (dataText === "")) ? "No data" : dataText);
                        }

                        return dataText;
                    };

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

function makeViz1a() {
    viz1a.tooltip = d3.select("body")
                      .append("div")
                      .classed("viz1a tooltip", true)
                      .style("z-index", 999);  // use z-index to make sure the tooltip shows up above the map

    viz1a.title = d3.select(".viz1a.title span")
                    .style("font-size", FONT_SIZES.title + "px")
                    .style("font-weight", "bold");

    // get unique iso_codes
    let covidISOCodes = Array.from(new Set(covidData.map(d => d.iso_code)));
    let geomISOCodes = geomData.features.map(d => d.properties.ISO_A3);

    let commonISOCodes = geomISOCodes.filter(d => covidISOCodes.includes(d));
    //let geomMissingISOCodes = geomISOCodes.filter(d => !covidISOCodes.includes(d));


    /***************************
    * Make the map.
    * geojson from https://datahub.io/core/geo-countries
    * converted to topojson (for compression) using https://mapshaper.org/
    **************************/
    const northeastCorner = L.latLng(84.4, 181);
    const southwestCorner = L.latLng(-58, -180);
    const maxBounds = L.latLngBounds(northeastCorner, southwestCorner);

    // ([center_x, center_y], zoom_level). I determined this center manually by dragging the map
    // around and checking map.getCenter(). Zoom levels are integers; you can get the current value with map.getZoom().
    const map = new L.Map("map")
                     .setView([40.97989807, 7.734375], 2)
                     .setMaxBounds(maxBounds);

    // to use openstreetmap instead:
    //L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    //}).addTo(map);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2hlb3BvcnlwdCIsImEiOiJja25ybGc4OTcwazVlMnZwaGdjY2lpb2NiIn0.rCIDJbLTQ4QVLTtHwHH6YQ', {
        maxZoom: 18,
        minZoom: 2,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/light-v9',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);

    // each path will have a classname = their ISO code (e.g., class="USA")
    // only give countries in our dataset a class of shape-[ISO code], and make other countries' polygons gray
    const styleLeafletPaths = function(feature) {
        return {
            className: commonISOCodes.includes(feature.properties.ISO_A3) ? "shape-" + feature.properties.ISO_A3 : null,
            fillColor: commonISOCodes.includes(feature.properties.ISO_A3) ? "blue" : "#eee",
            fillOpacity: commonISOCodes.includes(feature.properties.ISO_A3) ? 1.0 : 0.1
        };
    };

    L.geoJson(geomData, { style: styleLeafletPaths })
        .addTo(map);

    map.boxZoom.disable();

    d3.selectAll("#map path").attr("stroke", null);

    /*******************
    * add a transparent rectangle over top of the whole SVG so we can click anywhere
    * to remove items from the selection
    *******************/
    viz1a.svg = d3.selectAll("#map svg");
    viz1a.svg.select("g")
        .append("rect")
            .classed("click-area", true)
            .attr("width", viz1a.svg.attr("width"))
            .attr("height", viz1a.svg.attr("height"))
            .attr("fill", "blue")
            .attr("fill-opacity", 0);

    d3.select("#map rect.click-area")
        .style("pointer-events", "all")
        .on("click", function (event) {
            if (event.defaultPrevented) return;   // in case we're actually dragging

            if (!event.ctrlKey) {
                viz1.selectedCountries = [];
                d3.selectAll("#map .selected-country").classed("selected-country", false);
                
                // selection changed: re-draw!
                redrawViz1b();
                redrawViz1c();
                redrawViz2();
            }
        }).lower();
}

function makeViz1b() {
    viz1b.margin = { top: 10, right: 20, bottom: 80, left: 150 };
    let vizWidth = d3.min([d3.select("#map svg").attr("width"), window.innerWidth]) / 2 - 65;

    viz1b.dims = {
        //height: 350, width: d3.max([450,  // no smaller than 450px wide
        //    d3.min([650, // no larger than 650px wide
        //        Math.floor(window.innerWidth / 2)])])
        height: 300, width: vizWidth
    };
    viz1b.dims.innerHeight = viz1b.dims.height - viz1b.margin.top - viz1b.margin.bottom;
    viz1b.dims.innerWidth = viz1b.dims.width - viz1b.margin.left - viz1b.margin.right;

    viz1b.svg = d3.select("div.viz1b")
                  .append("svg")
                      .attr("width", viz1b.dims.width)
                      .attr("height", viz1b.dims.height)
                      .attr("viewBox", `0 0 ${viz1b.dims.width} ${viz1b.dims.height}`)
                      .attr("preserveAspectRatio", "xMinYMin")
                      .classed("viz1b", true)
                  .append("g")
                      .attr("transform", "translate(" + viz1b.margin.left + "," + viz1b.margin.top + ")");

    viz1b.yScale = d3.scaleBand()
                     .rangeRound([0, viz1b.dims.innerHeight - 10])
                     .paddingInner(0.1);  // rangeRound ensures all pixel values are non-fractional

    viz1b.xScale = d3.scaleLinear()
                     .rangeRound([0, viz1b.dims.innerWidth])
                     .clamp(true);  // any values outside the domain will be mapped to the bounds of the range


    // make y-axis
    viz1b.svg.append("g")
        .classed("viz1b y axis", true);

    viz1b.yAxis = d3.axisLeft(viz1b.yScale);

    // make x-axis
    viz1b.svg.append("g")
        .classed("viz1b x axis", true)
        .attr("transform", "translate(0," + viz1b.dims.innerHeight + ")");

    viz1b.xAxis = d3.axisBottom(viz1b.xScale);

    // x-axis gridlines
    // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    viz1b.svg.append("g")
        .classed("viz1b x grid", true)
        .attr("transform", "translate(0," + viz1b.dims.innerHeight + ")");

    viz1b.xAxisTicks = d3.axisBottom(viz1b.xScale)
                         .tickSize(-viz1b.dims.innerHeight)
                         .tickFormat("");

    viz1b.tooltip = d3.select("body")
                      .append("div")
                      .classed("viz1b tooltip", true);
}

function makeViz1c() {
    viz1c.margin = { top: 30, right: 150, bottom: 80, left: 80 };
    let vizWidth = d3.max([450, d3.min([d3.select("#map svg").attr("width"), window.innerWidth]) / 2 - 75]);

    viz1c.dims = {
        height: 300, width: vizWidth
    };
    viz1c.dims.innerHeight = viz1c.dims.height - viz1c.margin.top - viz1c.margin.bottom;
    viz1c.dims.innerWidth = viz1c.dims.width - viz1c.margin.left - viz1c.margin.right;

    viz1c.svg = d3.select("div.viz1c")
                  .append("svg")
                      .attr("width", viz1c.dims.width)
                      .attr("height", viz1c.dims.height)
                      .attr("viewBox", `0 0 ${viz1c.dims.width} ${viz1c.dims.height}`)
                      .attr("preserveAspectRatio", "xMinYMin")
                      .classed("viz1c", true)
                  .append("g")
                      .attr("transform", "translate(" + viz1c.margin.left + "," + viz1c.margin.top + ")");

    /***************
    * make y-axis (attribute)
    ***************/
    viz1c.yScale = d3.scaleLinear()
                     .rangeRound([viz1c.dims.innerHeight - 10, 0])  // [high, low] so it plots correctly
                     .clamp(true); // any values outside the domain will be mapped to the bounds of the range

    viz1c.svg.append("g")
        .classed("viz1c y axis", true);

    viz1c.yAxis = d3.axisLeft(viz1c.yScale);

    /***************
    * make x-axis (date)
    ***************/
    viz1c.xScale = d3.scaleTime()
                     .domain([minDate, maxDate])
                     .rangeRound([0, viz1c.dims.innerWidth]);

    viz1c.xAxis = d3.axisBottom(viz1c.xScale)
                    .tickFormat(formatMonthYear);

    viz1c.svg.append("g")
        .classed("viz1c x axis", true)
        .attr("transform", "translate(0," + viz1c.dims.innerHeight + ")")
        .call(viz1c.xAxis);

    d3.selectAll(".viz1c.x.axis .tick text")
        .style("font-weight", function(d) {return (isNaN(1*formatMonthYear(d)) ? "normal" : "bolder");});
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

    // Save an array of all dates. This is necessary for our special hover effect.
    viz1c.dates = Array.from(
        new Set(covidData.map(d => formatDate_yyyymmdd(d.date)))
    ).sort()
        .map(d => parseDate(d));

    viz1c.dateLine = viz1c.svg.append("line")
                          .classed("viz1c date-line", true)
                          .attr("stroke", "black")
                          .attr("stroke-width", 2)
                          .attr("stroke-dasharray", "3 3")
                          .attr("fill", "none")
                          .attr("x1", viz1c.xScale(viz1.selectedDate))
                          .attr("x2", viz1c.xScale(viz1.selectedDate))
                          .attr("y1", 0)
                          .attr("y2", viz1c.dims.innerHeight)
                          .lower();  // put the date line below the data

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
                        .style("display", "none");

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
        .on("mouseenter", function () {
            if (d3.selectAll(".viz1c .x").style("display") != "none") { // i.e., data is being shown
                marker.style("display", "inherit");
            }
        }).on("mouseleave", function () {
            marker.style("display", "none");

            if (!viz1c.clicked) {
                viz1c.svg.selectAll(".viz1c.line")
                    .attr("stroke", d => continentColors(d[1][0].continent))
                    .classed("hover-line", false);
            }
        }).on("click", function () {
            if (viz1c.clicked) {  // undo the click if we're already clicked
                viz1c.clicked = null;
                return;
            }
            viz1c.clicked = viz1c.svg.selectAll(".hover-line");
            if (viz1c.clicked.node()) {  // check that the hover is activated before trying to get its value
                viz1c.clicked = viz1c.clicked.datum()[0];  // get the country name for the highlighted line
            }
        }).on("mousemove", function (event) {
            event.preventDefault();

            if (viz1c.clicked && !(viz1c.nestedData.map(d => d[0]).includes(viz1c.clicked))) {
                // if we had clicked on a country, but now we've changed our country selection
                // and the clicked country doesn't exist in our selection, reset the clicked state
                viz1c.clicked = null;
            }

            let pointer = d3.pointer(event, this);  // get x,y position of pointer
            let xm = viz1c.xScale.invert(pointer[0]);  // get date value associated with x position
            let ym = viz1c.yScale.invert(pointer[1] < 0 ? 0 : pointer[1]); // get attribute value associated with y position

            // if outside the plot area, exit
            if (xm < d3.min(viz1c.dates)) { return; }

            let nearestDate = viz1c.dates[d3.bisectCenter(viz1c.dates, xm)];  // get the nearest date corresponding to the x-position of the mouse

            // filter to data associated with nearest date
            let data = viz1c.nestedData.map(function (d) {
                // each element of outermost array (1 per country)
                const rows = d[1].filter(function (d2) {
                    // each element of a country's array
                    return d2.date.getTime() == nearestDate.getTime();
                });
                return rows;
            });
            if (data.length == 0) { return; }

            // get row for country with nearest attribute value on this date
            // exception: if we're in the "clicked" state, get the selected country's values
            let closestCountryRow;
            if (!viz1c.clicked) {
                closestCountryRow = d3.least(data, function (d) {
                    const value = (isNaN(d[0][viz1c.attributeData]) ? 999999 : d[0][viz1c.attributeData]);
                    return Math.abs(ym - value);
                })[0];
            } else {
                closestCountryRow = d3.filter(data, d => d[0].countryname == viz1c.clicked)[0][0];
            }

            let closestValue = (closestCountryRow[viz1c.attributeData] > 0 ? closestCountryRow[viz1c.attributeData] : 0);
            let closestValueText = closestCountryRow[viz1.selectedAttribute];

            if(typeof closestValueText == "number") {
                closestValueText = (isNaN(closestValueText) ? "No data" : (Math.round(1000 * closestValueText) / 1000).toLocaleString()); // round to nearest 3 decimal places
            } else {
                closestValueText = (closestValueText == "NA" ? "No data" : closestValueText);
            }

            // for the non-active lines, set them to light gray. For the active/hovered line, leave its stroke as the default blue
            viz1c.svg.selectAll(".viz1c.line")
                .attr("stroke", function (d) {
                    if (d[0] == closestCountryRow.countryname) { return continentColors(d[1][0].continent); }
                    return "#ddd";
                }).classed("hover-line", d => d[0] == closestCountryRow.countryname);

            // adjust marker text alignment to avoid text going off the svg
            // if x-coordinate is in right 25% of SVG, make tooltips right-aligned; otherwise left-aligned
            // if y-coordinate *of marker* is in top 10% of SVG, put tooltips *below* the cursor; otherwise above
            let markerTextAlign = (pointer[0] > viz1c.xScale.range()[1] * 0.75 ? "end" : "start");
            let markerX = (pointer[0] > viz1c.xScale.range()[1] * 0.75 ? -5 : 5);

            d3.selectAll(".viz1c .marker-text")
                .attr("text-anchor", markerTextAlign)
                .attr("x", markerX);

            // since there are two textboxes with different y positions, we need to update one at a time
            // we also want to make sure that country is on top
            if (viz1c.yScale(closestValue) < viz1c.yScale.range()[0] * 0.1) {
                d3.selectAll(".viz1c .marker-text.country").attr("y", 8);
                d3.selectAll(".viz1c .marker-text.attribute").attr("y", 20);
            } else {
                d3.selectAll(".viz1c .marker-text.country").attr("y", -20);
                d3.selectAll(".viz1c .marker-text.attribute").attr("y", -8);
            }

            // move the marker to the appropriate location on the line
            marker.attr("transform", `translate(${viz1c.xScale(nearestDate)}, ${viz1c.yScale(closestValue)})`);
            marker.select("text.marker-text.country").text(closestCountryRow.countryname + ' (' + formatDateMonthDay(nearestDate) + ")");
            marker.select("text.marker-text.attribute").text(viz1c.attributeName + ": " + closestValueText);
            marker.raise();  // ensures that the text is always readable over the lines
        });
}

function makeViz1ContinentLegend() {
    let margin = { top: 30, right: 0, bottom: 0, left: 0 };
    let dims = {height: 300, width: 100};
    dims.innerHeight = dims.height - margin.top - margin.bottom;
    dims.innerWidth = dims.width - margin.left - margin.right;

    let svg = d3.select("div.viz1-continents")
                .append("svg")
                    .attr("width", dims.width)
                    .attr("height", dims.height)
                    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
                    .attr("preserveAspectRatio", "xMinYMin")
                    .classed("viz1", true)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append(() => legend({
                color: continentColors,
                title: "Continents",
                width: 25,
                height: (25 * continentColors.domain().length),
                ticks: 4,
                tickFormat: ".0f",
                reverseOrdinal: true
            }));
    
    d3.select("div.viz1-continents").style("display", "none");
}

function makeViz2() {
   d3.select("div.viz2 p").style("font-size", FONT_SIZES.title + "px");
   d3.select("#table-date").text(formatDateLong(maxDate));
}

function makeViz3() {
    viz3.margin = {top: 20, right: 150, bottom: 90, left: 150};

    viz3.dims = {height: 400, width: 600};
    viz3.dims.innerHeight = viz3.dims.height - viz3.margin.top - viz3.margin.bottom;
    viz3.dims.innerWidth = viz3.dims.width - viz3.margin.left - viz3.margin.right;

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

Promise.all([
    d3.csv("./data/data_dictionary.csv", dictRowParser),
    d3.csv("./data/covid_data.csv", dataRowParser),
    d3.json("./data/country_polygons.json")
]).then(function (files) {
    dataDict = files[0];
    covidData = files[1];
    geomData = files[2];

    console.log("Imported all data!");

    // these are used in multiple places
    minDate = d3.min(covidData, d => d.date);
    maxDate = d3.max(covidData, d => d.date);

    /***************************
    * Viz 1: Attributes dropdown. Add attributes with <optgroup> for each category, <option> for each attribute
    **************************/
    //add attributes to the attribute dropdown menu;
    let selectAttr = d3.select("select#viz1-attributes");

    // first, put categories in as optgroups
    Array.from(new Set(dataDict.filter(d => d.sort_order != 0)
        .map(d => d.category)))
        .forEach(function (category) {
            selectAttr.append("optgroup")
                .attr("label", category);
        });

    // now put attributes into the optgroups
    dataDict.filter(d => d.sort_order != 0)
        .map(d => ({
            category: d.category,
            variable_name: d.variable_name,
            display_name: d.display_name
        }))
        .forEach(function (attrRow, i) {
            d3.select("select#viz1-attributes optgroup[label='" + attrRow.category + "']")
                .append("option")
                    .attr("value", attrRow.variable_name)
                    .text(attrRow.display_name);

            // initialize attribute to first row in data dictionary
            if (i == 0) { viz1.selectedAttribute = attrRow.variable_name; }
        });

    // create listener
    selectAttr
        .on("change", function () {
            viz1.selectedAttribute = d3.select(this)
                .select("option:checked")
                .attr("value");  // want value (variable_name), not the text (display_name)
           
            redrawViz1All();

            let selectedName = d3.select(this)
                                 .select("option:checked")
                                 .text();

            // also update the highlighted row in the viz2 table
            d3.selectAll(".viz2-table table tr td:first-of-type")
                .each(function() {
                    td = d3.select(this);
                    //console.log([td.text(), selectedName, td.text() == selectedName, d3.select(this.parentNode).node()]);
                    d3.select(this.parentNode).classed("selected-row", td.text() == selectedName);
                });
        });


    /***************************
    * Viz 1: Checkbox for determining how the max is set on scales.
    **************************/
    let checkbox = d3.select("input[name='viz1-scale-checkbox']");
    viz1.scaleMaxToDate = checkbox.property("checked");

    checkbox.on("click", function () {
        viz1.scaleMaxToDate = d3.select(this).property("checked");
        
        // can't do scale to today's max and quantile at the same time
        if(viz1.quantileColor) {
            viz1.quantileColor = false;
            d3.select("input[name='viz1-quantile-checkbox']").property("checked", false);
        }

        redrawViz1a();
        redrawViz1b(); // this checkbox doesn't affect viz 1c
    });

    /***************************
    * Viz 1: Checkbox for determining how the max is set on scales.
    **************************/
    checkbox = d3.select("input[name='viz1-quantile-checkbox']");
    viz1.quantileColor = checkbox.property("checked");

    checkbox.on("click", function () {
        viz1.quantileColor = d3.select(this).property("checked");

        // can't do scale to today's max and quantile at the same time
        if(viz1.scaleMaxToDate) {
            viz1.scaleMaxToDate = false;
            d3.select("input[name='viz1-scale-checkbox']").property("checked", false);
        }

        redrawViz1a();  // this checkbox doesn't affect viz1b or viz1c
    });

    /***************************
    * Viz 2 Category dropdown
    **************************/
    let selectCat = d3.select("select#viz2-categories");

    // get unique categories, then append <option> to <select>
    Array.from(new Set(dataDict.filter(d => d.sort_order != 0)
                               .map(d => d.category)))
         .forEach(function(category, i) {
            selectCat.append('option')
                     .attr("value", category)
                     .text(category)
                     .property("checked", i==0);
         });

    viz2.selectedCategory = selectCat.select("option:checked").attr("value");

    // create listener
    selectCat.on("change", function() {
        viz2.selectedCategory = d3.select(this)
                                  .select("option:checked")
                                  .attr("value");

        redrawViz2();
    });

    /***************************
    * Viz 3: Make both attribute dropdowns. Add attributes with <optgroup> for each category, <option> for each attribute
    **************************/
    const makeAttributeDropdown = function(xOrY = "x") {
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
        
        // initialize with x dropdown = "New cases" and y dropdown = "School closing"
        d3.selectAll("select#viz3-xattributes option")
            .filter(function() {return (d3.select(this).text() == "New cases");})
            .attr("selected", "selected");

        d3.selectAll("select#viz3-yattributes option")
            .filter(function() {return (d3.select(this).text() == "School closing");})
            .attr("selected", "selected");
        
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
    };

    makeAttributeDropdown("x");
    makeAttributeDropdown("y");

    viz3.selectedXAttribute = d3.select("select#viz3-xattributes option:checked").attr("value");
    viz3.selectedYAttribute = d3.select("select#viz3-yattributes option:checked").attr("value");


    /***************************
    * Create the viz!
    **************************/
    viz1.selectedDate = viz3.selectedDate = maxDate;
    makeDateSlider(viz1, "#viz1-date-slider-wrap");
    makeDateSlider(viz3, "#viz3-date-slider-wrap");
    
    // initialize with these four countries
    viz1.selectedCountries = ["United States", "Russia", "China", "Brazil"];
    makeViz1a();
    makeViz1b();
    makeViz1c();
    makeViz1ContinentLegend();
    
    // make sure these four are highlighted on the map at load time
    d3.select(".shape-USA").classed("selected-country", true);
    d3.select(".shape-RUS").classed("selected-country", true);
    d3.select(".shape-CHN").classed("selected-country", true);
    d3.select(".shape-BRA").classed("selected-country", true);

    viz1.redrawFunc = redrawViz1All; // need this to be able to handle timestep updates
    dateUpdate(viz1, viz1.selectedDate);  // this will kick off all the redraws for viz 1

    makeViz2();
    redrawViz2();  // since we don't have a dateUpdate step for this viz, we have to manually kick this off for viz 2

    makeViz3();
    viz3.redrawFunc = redrawViz3;  // this is needed to handle timestep updates
    dateUpdate(viz3, viz3.selectedDate);  // this will kick off the redraw for viz 3


    
    d3.selectAll(".spinner").remove();
    d3.select("#viz1-container").style("margin-left", "0px");
    d3.select("#viz2-container").style("margin-left", "0px");
    d3.select("#viz3-container").style("margin-left", "0px");
});
