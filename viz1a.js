const FONT_SIZES = {
    tick: 12,
    axisTitle: 14,
    title: 16,
    markerText: 12,
    legendLabel: 10
}

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

var viz1a = {};  // empty object which will contain all stuff necessary for drawing/redrawing viz1a


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

function redrawViz1All() {
    redrawViz1a();
}

function redrawViz1a() {
    const viz1aData = covidData.filter(d => d.date.getTime() == viz1.selectedDate.getTime());
    const var_metadata = dataDict.filter(d => d.variable_name == viz1.selectedAttribute)[0];

    let attributeName = var_metadata.display_name;
    viz1a.title.text(attributeName + " among countries on " + formatDateLong(viz1.selectedDate));

    if(var_metadata.data_type == "ordinal") {
        // uncheck and disable both checkboxes for ordinal variables
        viz1.quantileColor = false;
        d3.select("input[name='viz1-quantile-checkbox']").property("checked", false);

        viz1.scaleMaxToDate = false;
        d3.select("input[name='viz1-scale-checkbox']").property("checked", false);

        d3.selectAll(".viz1.checkbox-container").style("display","none")
    } else {
        d3.selectAll(".viz1.checkbox-container").style("display","inline-block")
    }

    /******
     * update legend and colors in map
    ******/
    let colorScale;  // this is used to decide which color scale to use for the legend
    let colorPalette;
    let ordinalValues = [];

    if(var_metadata.larger_is == "good") {
        colorPalette = (var_metadata.data_type == "ordinal" ? d3.schemeYlGn : d3.interpolateYlGn);
    } else if(var_metadata.larger_is == "bad") {
        colorPalette = (var_metadata.data_type == "ordinal" ? d3.schemeYlOrBr : d3.interpolateYlOrBr);
    } else {  // neutral
        colorPalette = (var_metadata.data_type == "ordinal" ? d3.schemePurples : d3.interpolatePurples);
    }

    if (var_metadata.data_type == "ordinal") {
        // get possible values, using the text version of attribute (1-Local, 1-National, etc.)
        ordinalValues = Array.from(new Set(covidData.map(d => (d[viz1.selectedAttribute] == "NA" ? "0" : d[viz1.selectedAttribute]) ))).sort();
        colorScale = d3.scaleOrdinal(colorPalette[ordinalValues.length]).domain(ordinalValues);  // note: the max # of colors for this color scale is 9
    } else if (viz1.quantileColor) {
        colorScale = d3.scaleSequentialQuantile(colorPalette)
                        .domain(viz1aData.map(d => (d[viz1.selectedAttribute] < 0 ? 0 : d[viz1.selectedAttribute])));
    } else {
        let maxValue;

        if ((!viz1.scaleMaxToDate) && (var_metadata.category == "aggregate indices")) {
            maxValue = 100.0;
        } else {
            // if scaling to just today, use the filtered data in viz1aData, otherwise use all data in covidData
            maxValue = d3.max((viz1.scaleMaxToDate ? viz1aData : covidData), d => d[viz1.selectedAttribute]);
            maxValue = isNaN(maxValue) ? 0 : maxValue;
        }

        colorScale = d3.scaleSequential(colorPalette).domain([0, maxValue]);
    }

    const legendHeight = var_metadata.data_type == "ordinal" ? (25 * ordinalValues.length) : 50;

    d3.selectAll(".viz1a.legend").remove();  // if it already exists, remove it and replace it
    d3.select("#map")
        .append("div")  // this ensures it doesn't move with the map when we drag it
            .classed("viz1a legend", true)
            .style("position", "relative")
            .style("z-index", 99999)  // this plus the position:relative makes it appear on top
            .style("pointer-events", "none")  // this ensures we don't block the mouseovers, clicks, etc
        .append(() => legend({
            color: colorScale,
            title: attributeName,
            width: var_metadata.data_type == "ordinal" ? 25 : 200,
            height: legendHeight,
            ticks: 4,
            tickFormat: ".0f"
        }));

    const legendTop = viz1a.svg.attr("height") - 150 - (var_metadata.data_type != "ordinal" ? 
                                                            0 : 
                                                            ordinalValues.length * d3.select(".legend rect").attr("height"));

    d3.select("#map .legend svg")
        .style("position", "relative")
            .style("top", legendTop)
            .style("left", 20);

    d3.selectAll("#map .tick text").style("font-size", FONT_SIZES.legendLabel + "px");
    d3.select("#map .legend-title").style("font-size", FONT_SIZES.axisTitle + "px");
    


    // bind data to each path
    d3.selectAll("#map path[class^='shape-']")
        .data(viz1aData, function (d) {
            return d ? d.iso_code : d3.select(this).attr("class").match(/(?<=shape-)[A-Z]{3}/)[0];
        }).on("mousemove", function (event, d) {
            viz1a.tooltip
                .style("left", event.pageX < 50 ? 0 : event.pageX - 50 + "px")
                .style("top", event.pageY < 70 ? 0 : event.pageY - 70 + "px")
                .style("display", "inline-block")
                // Also, don't show NaN or "NA". If no data, write "No data"
                .html((d.countryname) + "<br><b>" + attributeName + "</b>: " + (((typeof d[viz1.selectedAttribute] == "number" && isNaN(d[viz1.selectedAttribute])) || d[viz1.selectedAttribute] == "NA") ? "No data" : d[viz1.selectedAttribute]));
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
                    console.log(["added " + country, viz1.selectedCountries]);
                } else {
                    viz1.selectedCountries = viz1.selectedCountries.filter(d => d != country);
                    d3.select(this).classed("selected-country", false);
                    console.log(["removed " + country, viz1.selectedCountries]);
                }
            } else {
                if (viz1.selectedCountries.length > 0) {
                    // if the clicked country was already in the list, clear out the entire list
                    // if the clicked country was not in the list, clear the list and put this country in
                    const includedCountry = viz1.selectedCountries.includes(country);
                    viz1.selectedCountries = [];
                    d3.selectAll("#map .selected-country").classed("selected-country", false);
                    console.log(["removed all countries", viz1.selectedCountries]);

                    if (!includedCountry) {
                        viz1.selectedCountries.push(country);
                        d3.select(this).classed("selected-country", true);
                        console.log(["added " + country, viz1.selectedCountries]);
                    }
                } else {
                    viz1.selectedCountries.push(country);
                    d3.select(this).classed("selected-country", true);
                    console.log(["added " + country, viz1.selectedCountries]);
                }
            }

        }).transition()
        .duration(viz1.shortenTransitions > 0 ? viz1.shortenTransitions : 200)
        .attr("fill", function (d) {
            let val;

            if(var_metadata.data_type == "ordinal") {
                val = d[viz1.selectedAttribute] == "NA" ? "0" : d[viz1.selectedAttribute];
            } else {
                val = ((isNaN(d[viz1.selectedAttribute]) || (d[viz1.selectedAttribute] < 0)) ? 0 : d[viz1.selectedAttribute]);
            }
            return colorScale(val);
        });
}

function makeViz1a() {
    viz1.redrawFunc = redrawViz1All; // need this to be able to handle timestep updates

    viz1a.tooltip = d3.select("body")
        .append("div")
            .classed("viz1a tooltip", true)
            .style("z-index", 999);  // use z-index to make sure the tooltip shows up above the map

    viz1a.title = d3.select(".viz1a.title span")
        .style("font-size", FONT_SIZES.title + "px")
        .style("font-weight", "bold");

    // get unique iso_codes
    covidISOCodes = Array.from(new Set(covidData.map(d => d.iso_code)));
    geomISOCodes = geomData.features.map(d => d.properties.ISO_A3);

    commonISOCodes = geomISOCodes.filter(d => covidISOCodes.includes(d));
    geomMissingISOCodes = geomISOCodes.filter(d => !covidISOCodes.includes(d));


    /***************************
    * Make the map.
    * geojson from https://datahub.io/core/geo-countries
    * converted to topojson (for compression) using https://mapshaper.org/
    **************************/
    const northeastCorner = L.latLng(84.4, 181)
    const southwestCorner = L.latLng(-58, -180)
    const maxBounds = L.latLngBounds(northeastCorner, southwestCorner);

    // ([center_x, center_y], zoom_level). I determined this center manually by dragging the map
    // around and checking map.getCenter(). Zoom levels are integers; you can get the current value with map.getZoom().
    map = new L.Map("map")
        .setView([40.97989807, 7.734375], 2)
        .setMaxBounds(maxBounds);

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
    function styleLeafletPaths(feature) {
        return {
            className: commonISOCodes.includes(feature.properties.ISO_A3) ? "shape-" + feature.properties.ISO_A3 : null,
            fillColor: commonISOCodes.includes(feature.properties.ISO_A3) ? "blue" : "#eee",
            fillOpacity: commonISOCodes.includes(feature.properties.ISO_A3) ? 1.0 : 0.1
        }
    }

    L.geoJson(geomData, { style: styleLeafletPaths })
        .addTo(map);

    map.boxZoom.disable();


    /*******************
     * Add hover events
     *******************/
    // these events don't change with data, so we can set them here
    d3.selectAll("#map path[class^='shape-']")
        .on("mouseover", function () {
            d3.select(this).classed("hover-country", true);
        }).on("mouseout", function () {
            d3.select(this).classed("hover-country", false);
            viz1a.tooltip.style("display", "none");
        });

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
            if (!event.ctrlKey) {
                viz1.selectedCountries = [];
                d3.selectAll("#map .selected-country").classed("selected-country", false);
                console.log(["removed all countries", viz1.selectedCountries]);
            }
        }).lower();

    makeDateSlider(viz1, "#viz1-date-slider-wrap");
    viz1.selectedDate = d3.max(covidData, d => d.date);
    dateUpdate(viz1, viz1.selectedDate);
}

Promise.all([
    d3.csv("../data/data_dictionary.csv", dictRowParser),
    d3.csv("../data/covid_data.csv", dataRowParser),
    //d3.csv("../data/covid_oxford+owid_20210421-154648.csv", dataRowParser),
    d3.json("../data/countries-mapshaper-simplified_v2.json")
    //d3.csv("../data/covid_oxford+owid_20210414-185830.csv", dataRowParser),
]).then(function (files) {
    dataDict = files[0];
    covidData = files[1];
    geomData = files[2];

    console.log("Imported all data!");


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
            d3.select("optgroup[label='" + attrRow.category + "']")
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
            redrawViz1a();
        });


    /***************************
    * Checkbox for determining how the max is set on scales.
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
    })

    /***************************
    * Checkbox for determining how the max is set on scales.
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

        redrawViz1a();
    })

    /***************************
    * Create the viz!
    **************************/
    makeViz1a();
    d3.selectAll(".spinner").remove();
    d3.select("#main-container").attr("style", null);
});
