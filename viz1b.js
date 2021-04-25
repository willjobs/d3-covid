const FONT_SIZES = {
    tick: 12,
    axisTitle: 14,
    title: 16,
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

// these properties apply to all 3 of the viz1 visualizations
var viz1 = {
    selectedCountries: [],
    scaleMaxToDate: false,  // if false, set scales' maxes to the max over whole timeframe; if true, set max to just values observed on selected date
    quantileColor: false,    // if true, use scaleSequentialQuantile for colors; if false, use scaleSequential
    shortenTransitions: 0  // this is to allow us to speed up transitions when dragging the date slider
}

var viz1b = {};  // these are specific to viz1b

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

    viz.svgSlider = d3.select("#viz1-date-slider-wrap")
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

    viz1b.title.text(attributeName + " on " + formatDateLong(viz1.selectedDate));

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
    if ((varMetadata.data_type == "ordinal")) {
        // get largest value over entire dataset, not just selection
        let maxValue = d3.max(covidData, d => d[attributeData]);
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
                              d => d[attributeData]);
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
            .attr("id", function (d, i) { return "viz1b-bar" + i })
        .merge(bars)
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .attr("y", d => viz1b.yScale(d.countryname))
            .attr("height", viz1b.yScale.bandwidth())
            .attr("width", d => viz1b.xScale(isNaN(d[attributeData]) || (d[attributeData] < 0) ? 0 : d[attributeData]));

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
            .on("mouseover", function () {
                d3.select(this).classed("hover-bar", true);
            }).on("mousemove", function (event, d) {
                let dataText = d[viz1.selectedAttribute];
                if(typeof dataText == "number") {
                    dataText = (isNaN(dataText) ? "No data" : Math.round(1000 * dataText) / 1000);  // round to 3 digits
                } else {
                    dataText = (dataText == "NA" ? "No data" : dataText);
                }
                
                viz1b.tooltip
                    .style("left", event.pageX - 50 + "px")
                    .style("top", event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    // note: display attributeName's value, not attributeData, because we want to see the categorical value, not numeric version
                    // Also, don't show NaN or "NA". If no data, write "No data"
                    .html((d.countryname) + "<br><b>" + attributeName + "</b>: " + dataText);
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
            .attr("id", function (d, i) { return "viz1b-nodata" + i })
        .merge(noData)
            .transition()
            .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 500)
            .attr("y", d => viz1b.yScale(d.countryname) + 0.5 * viz1b.yScale.bandwidth())
            .attr("dy", "0.3em")
            .style("visibility", d => (isNaN(d[attributeData]) || d[attributeData] == "NA" ? "visible" : "hidden"))
            .text(d => (isNaN(d[attributeData]) || d[attributeData] == "NA" ? "No data" : ""));
}

function redrawViz1All() {
    redrawViz1b();
}

function makeViz1b() {
    viz1.redrawFunc = redrawViz1All;  // need this to be able to handle timestep updates

    viz1b.margin = { top: 30, right: 20, bottom: 80, left: 175 };

    viz1b.dims = {
        height: 450, width: d3.max([600,  // no smaller than 600px wide
            d3.min([900, // no larger than 900px wide
                Math.floor(window.innerWidth / 2)])])
    };
    viz1b.dims["innerHeight"] = viz1b.dims.height - viz1b.margin.top - viz1b.margin.bottom
    viz1b.dims["innerWidth"] = viz1b.dims.width - viz1b.margin.left - viz1b.margin.right

    viz1b.svg = d3.select("div.viz1b")
        .append("svg")
            .attr("width", viz1b.dims.width)
            .attr("height", viz1b.dims.height)
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

    viz1b.title = viz1b.svg.append("text")
        .classed("viz1b title", true)
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "start")
        .attr("transform", "translate(0, -10)")
        .style("font-size", FONT_SIZES.title + "px");

    makeDateSlider(viz1, "#viz1-date-slider-wrap");
    viz1.selectedDate = d3.max(covidData, d => d.date);
    dateUpdate(viz1, viz1.selectedDate);
}

// load the data and kick things off
Promise.all([
    d3.csv("../data/data_dictionary.csv", dictRowParser),
    d3.csv("../data/covid_data.csv", dataRowParser),
    //d3.csv("../data/covid_oxford+owid_20210414-185830.csv", dataRowParser),
]).then(function (files) {
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
        .forEach(function (country) {
            selectCountry.append('option')
                .attr("value", country)
                .text(country);
        });

    // create listener
    selectCountry
        .on("change", function () {
            let countries = [];

            selected = d3.select(this)
                .selectAll("option:checked")
                .each(function () { countries.push(this.value) }); // for each select country, get its value (name)

            // want to maintain ordering of original selection
            viz1.selectedCountries = viz1.selectedCountries.filter(d => countries.includes(d));
            added = countries.filter(d => !viz1.selectedCountries.includes(d));
            viz1.selectedCountries = viz1.selectedCountries.concat(added);

            redrawViz1b();
        });


    /***************************
    * Attributes dropdown. Add attributes with <optgroup> for each category, <option> for each attribute
    **************************/
    //add attributes to the attribute dropdown menu;
    selectAttr = d3.select("select#viz1-attributes");

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
            redrawViz1b();
        });

    /***************************
    * Create the viz!
    **************************/
    makeViz1b();
    d3.selectAll(".spinner").remove();

}).catch(function (err) {
    d3.selectAll(".spinner").remove();
    console.error('Error: ' + err);
})
