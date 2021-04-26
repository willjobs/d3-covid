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

var viz2 = {
    selectedCountries: []
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

function redrawViz2() {
    //Get the data for selected countries
    let viz2Data = covidData.filter(d => viz2.selectedCountries.includes(d.countryname));
    let var_metadata = dataDict.filter(d => d.variable_name == viz2.selectedAttribute)[0];

    // if ordinal, use numeric_column attribute (e.g., c1_school_closing_numeric), otherwise use attribute as selected
    let attributeData = var_metadata.data_type == "ordinal" ? var_metadata.numeric_column : viz2.selectedAttribute;

    viz2.title.text(var_metadata.display_name + " over time");
    // viz2.subtitle.text('viz2.selectedCountries');

    /******
     * update y-axis (attribute)
    ******/
    // see if this variable is ordinal; if it is, use its "_numeric" column

    if((var_metadata.data_type == "ordinal")) {
        // get largest value over entire dataset, not just selection
        let maxValue = d3.max(covidData, d => d[attributeData]);

        // set tick values to exactly these values
        // e.g., if maxValue = 2.5, ticks will be: 0, 0.5, 1, 1.5, 2, 2.5
        viz2.yScale.domain([0, maxValue]);
        viz2.yAxis.tickValues(d3.range(0, maxValue + 0.5, 0.5));
    } else {
        // If we're showing an aggregate index like "stringency index", always show 0 to 100.
        // Otherwise, get the maximum value for the attribute *across the whole dataset* for
        //    the selected countries. This is because we don't want the scales to keep jumping
        //    around for a given set of countries and making it hard to see changes.
        if(var_metadata.category == 'aggregate indices') {
            maxValue =  100.0;
        } else{
            maxValue = d3.max(covidData.filter(d => viz2.selectedCountries.includes(d.countryname)),
                                d => d[attributeData]);
        }

        viz2.yScale.domain([0, maxValue]);

        // if we switched from an ordinal variable, get rid of the manually specified ticks
        viz2.yAxis.tickValues(null);
        viz2.yAxisTicks.ticks(5);
    }

    // Update y-axis (x-axis is constant)
    d3.select(".viz2.y.axis")
        .transition()
        .duration(300)
        .call(viz2.yAxis);

    // add the Y gridlines (x-axis is constant)
    // see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    d3.select(".viz2.y.grid")
        .call(viz2.yAxisTicks);

    // set all ticks' fonts. These aren't styles/CSS, these are attributes
    d3.selectAll(".viz2.axis")
        .attr("font-size", FONT_SIZES.tick)
        .attr("font-family", "sans-serif");

    /******
     * Lines of the plot
    ******/
    // create a "nested" structure to allow us to draw one line per country
    // see https://stackoverflow.com/a/35279106/1102199
    // "d3.nest()" is deprecated; see https://github.com/d3/d3-array/blob/master/README.md#group
    nestedData = d3.group(viz2Data, d => d.countryname);

    let lineGenerator = d3.line()
                            .defined(function(d) {return !isNaN(d[attributeData])})
                            .x(d => viz2.xScale(d.date))
                            .y(d => viz2.yScale(d[attributeData] >= 0 ? d[attributeData] : 0));

    let lines = viz2.svg.selectAll(".viz2.line")
                    .data(nestedData, d => d[0]);  // "key" is the country name in the grouped dataset
    
    let labels = viz2.svg.selectAll(".viz2.line-label")
                     .data(nestedData, d => d[0]);
    
    lines.exit()
        .transition()
        .duration(200)
        .style("stroke-opacity", 0)
        .remove();

    labels.exit()
        .transition()
        .duration(200)
        .style("fill-opacity", 0)
        .remove();

    lines.enter()
        .append("path")
            .classed("viz2 line", true)
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
            .merge(lines)
                .attr("stroke", d => continentColors(d[1][0].continent))
                .attr("stroke-opacity", 1)
                .attr("id", d => "line-" + d[0])
                .transition()
                .duration(500)
                .attr("d", d => lineGenerator(d[1]));

    labels.enter()
        .append("text")
            .classed("viz2 line-label", true)
            .attr("font-size", FONT_SIZES.lineLabel)
        .merge(labels)
            .text(d => d[0])    
            .attr("x", viz2.dims.innerWidth + 5)
            .attr("stroke", d => continentColors(d[1][0].continent))
            .attr("stroke-width", 0.75)
            .transition()
            .duration(500)
            .style("fill-opacity", 1)
            .attr("y", function(d) {
                const lastValue = d[1].slice(-1)[0][attributeData];
                return viz2.yScale(lastValue > 0 ? lastValue : 0);
            });

    /************
     * Create the table
    ************/
    if(viz2Data.length == 0) {return}

    const categoryAttributes = dataDict.filter(d => d.category == viz2.selectedCategory);
    const maxDate = d3.max(covidData, d => d.date).getTime();
    const viz2TableData = viz2Data.filter(d => d.date.getTime() == maxDate);  // table only shows latest data
    
    d3.select(".viz2 table").remove(); // remove the table we're updating
    const table = d3.select(".viz2").append("table");

    const WIDTH_PER_COUNTRY_COL = 125;
    const WIDTH_ATTRIBUTE_COL = 200;

    table.attr("width", WIDTH_ATTRIBUTE_COL + viz2.selectedCountries.length * WIDTH_PER_COUNTRY_COL);

    // append the header row. First column = "attribute", then one column per country
    const headerRow = table.append("thead").append("tr");
    headerRow.append("th")
             .text("Attribute")
             .classed("attribute-name", true)
             .attr("width", WIDTH_ATTRIBUTE_COL);

    viz2.selectedCountries.forEach(function(country) {
        headerRow.append("th")
                 .text(country)
                 .attr("width", WIDTH_PER_COUNTRY_COL);
    });

    // add the data rows. First cell in each row is the attribute, the remaining cells are the countries' values
    const tbody = table.append("tbody");

    categoryAttributes.forEach(function(attribute) {
        const tr = tbody.append("tr");

        if(attribute.variable_name == viz2.selectedAttribute) {
            tr.classed("selected-row", true);
        }

        tr.append("td")
            .classed("attribute-name", true)
            .text(attribute.display_name);
        
        // make a map from country --> attribute value
        const attributeMap = viz2TableData.reduce(
            function(map, obj) {
                map[obj.countryname] = obj[attribute.variable_name]; 
                return map
        }, {});

        // add each country's value, in order of appearance
        // round numeric values to 3 decimal places, and replace "NAN" or "NA" with "No data"
        viz2.selectedCountries.forEach(function(country) {
            let valText = attributeMap[country];
            if(typeof valText == "number") {
                valText = (isNaN(valText) ? "No data" : (Math.round(1000 * valText) / 1000).toLocaleString()); // round to nearest 3 decimal places
            } else {
                valText = (((valText == "NA") || (valText == "")) ? "No data" : valText);
            }

            tr.append("td").text(valText);
        });
    });
}

function makeViz2() {
    viz2.margin = {top: 40, right: 150, bottom: 60, left: 70};

    viz2.dims = {height: 400, width: d3.max([600,  // no smaller than 600px wide
                                    d3.min([900, // no larger than 900px wide
                                            Math.floor(window.innerWidth / 2)])])};

    viz2.dims["innerHeight"] = viz2.dims.height - viz2.margin.top - viz2.margin.bottom
    viz2.dims["innerWidth"] = viz2.dims.width - viz2.margin.left - viz2.margin.right


    /***************
     *  Create svg
    ***************/
    viz2.svg = d3.select("div.viz2")
                 .append("svg")
                     .attr("width", viz2.dims.width)
                     .attr("height", viz2.dims.height)
                     .attr("viewBox", `0 0 ${viz2.dims.width} ${viz2.dims.height}`)
                     .attr("preserveAspectRatio", "xMinYMin")
                     .classed("viz2", true)
                 .append("g")
                     .attr("transform", "translate(" + viz2.margin.left + "," + viz2.margin.top + ")");

    /***************
     * Scales
    ***************/
    viz2.yScale = d3.scaleLinear()
                    // rangeRound ensures all pixel values are non-fractional
                    .rangeRound([viz2.dims.innerHeight - 10, 0]); // [high, low] so it plots correctly

    let minDate = d3.min(covidData, d => d.date);
    let maxDate = d3.max(covidData, d => d.date);

    viz2.xScale = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .rangeRound([0, viz2.dims.innerWidth]);

    /***************
     * make y-axis (attribute)
    ***************/
    viz2.svg.append("g")
        .classed("viz2 y axis", true);

    viz2.yAxis = d3.axisLeft(viz2.yScale);

    /***************
    * make x-axis (date)
    ***************/
    viz2.xAxis = d3.axisBottom(viz2.xScale);

    viz2.svg.append("g")
        .classed("viz2 x axis", true)
        .attr("transform", "translate(0," + viz2.dims.innerHeight + ")")
        .call(viz2.xAxis);

    /***************
    * x-axis gridlines
    * see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    ***************/
    viz2.xAxisTicks = d3.axisBottom(viz2.xScale)
                        .tickSize(-viz2.dims.innerHeight)
                        .tickFormat("");

    viz2.svg.append("g")
        .classed("viz2 x grid", true)
        .attr("transform", "translate(0," + viz2.dims.innerHeight + ")")
        .call(viz2.xAxisTicks);  // X-axis gridlines shouldn't change

    //rotate x-axis ticks
    d3.selectAll('.viz2.x.axis .tick text')
        .attr("transform","rotate(-45)")
        .attr("text-anchor","end")

    /***************
     * y-axis gridlines
     * see: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    ***************/
    viz2.yAxisTicks = d3.axisLeft(viz2.yScale)
                        .tickSize(-viz2.dims.innerWidth)
                        .tickFormat("");

    viz2.svg.append("g")
        .classed("viz2 y grid", true);
        // note: can't call yAxisTicks yet because it depends on data


    /***************
     * chart title
    ***************/
    viz2.title = viz2.svg.append("text")
                     .classed("viz2 title", true)
                     .attr("x", 0)
                     .attr("y", 0)
                     .attr("text-anchor", "start")
                     .attr("transform", "translate(0, -10)")
                     .style("font-size", "20px");
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
    selectCountry = d3.select("select#viz2-countries");

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
        viz2.selectedCountries = viz2.selectedCountries.filter(d => countries.includes(d));
        let added = countries.filter(d => !viz2.selectedCountries.includes(d));
        viz2.selectedCountries = viz2.selectedCountries.concat(added);

        redrawViz2();
    });

    /***************************
    * 1st dropdown: Category
    **************************/
    // add attributes to the attribute dropdown menu;
    selectCat = d3.select("select#viz2-categories");
    selectAttr = d3.select("select#viz2-attributes");

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

    const populateAttributeSelector = function (category) {
        selectAttr.selectAll("option").remove();

        dataDict.filter(d => d.category == category)
                .forEach(function(attribute, i) {
                    selectAttr.append('option')
                        .attr("value", attribute.variable_name)
                        .text(attribute.display_name)
                        .property("checked", i == 0);
                });
    }

    // create listener
    selectCat.on("change", function() {
        viz2.selectedCategory = d3.select(this)
                                  .select("option:checked")
                                  .attr("value");

        // use the new category's category to populate the attribute select list
        populateAttributeSelector(viz2.selectedCategory);
        viz2.selectedAttribute = selectAttr.select("option:checked").attr("value");

        redrawViz2();
    });

    /***************************
    * 2nd dropdown: Attributes
    **************************/
    populateAttributeSelector(viz2.selectedCategory);
    viz2.selectedAttribute = selectAttr.select("option:checked").attr("value");

    // create listener
    selectAttr
        .on("change", function() {
            viz2.selectedAttribute = d3.select(this)
                                       .select("option:checked")
                                       .attr("value");  // want value (variable_name), not the text (display_name)
            redrawViz2();
        });


    /***************************
    * Create the viz!
    **************************/
    makeViz2();
    redrawViz2();  // since we don't have a dateUpdate step for this viz, we have to manually kick this off
    d3.selectAll(".spinner").remove();
    d3.select("#viz2-container").style("margin-left", "0");
});
