import os
from datetime import datetime
import csv
import pandas as pd
import numpy as np


# Our World in Data
OWID_LINK = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv'

# Oxford dataset (OxCGRT)
OXFORD_LINK = 'https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/OxCGRT_latest_combined.csv'

# for column names, and for columns E3, E4, H4, H5
OXFORD_NICE_LINK = 'https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/OxCGRT_latest.csv'


def download_data():
    print("Downloading data...", flush=True)
    print("    Downloading OWID....", end="", flush=True)
    owid = pd.read_csv(OWID_LINK)
    print("Done.", flush=True)
    print("    Downloading Oxford....", end="", flush=True)
    oxford = pd.read_csv(OXFORD_LINK)
    print("Done.", flush=True)
    print("    Downloading Oxford (nice)....", end="", flush=True)
    oxford_nice = pd.read_csv(OXFORD_NICE_LINK)
    print("Done.", flush=True)
    print("Initial download shapes:", flush=True)
    print(f'    OWID: {owid.shape}', flush=True)
    print(f'    Oxford: {oxford.shape}', flush=True)
    print(f'    Oxford_nice: {oxford_nice.shape}', flush=True)
    
    print("\nDone\n", flush=True)

    return [owid, oxford, oxford_nice]


def lowercase_column_names(datasets):
    print("Lowercasing column names...", end="", flush=True)
    for dataset in datasets:
        dataset.columns = [x.lower() for x in dataset.columns]
    print("done\n", flush=True)


def reformat_dates(datasets):
    print("Reformatting dates...", end="", flush=True)
    # Get dates into same format
    def parse_date(r):
        datestr = str(r['date'])
        return datestr[:4] + '-' + datestr[4:6] + '-' + datestr[-2:]

    for dataset in datasets:
        dataset['date'] = dataset.apply(parse_date, axis=1)
    print("done\n", flush=True)


def convert_dates(datasets):
    print("Converting dates...", end="", flush=True)
    # convert all dates to pandas datetimes for alignment
    for dataset in datasets:
        dataset['date'] = pd.to_datetime(dataset['date'])
    
    print("done\n", flush=True)


def intersect_dates(datasets_dict):
    print("Filtering dates to common window...", flush=True)

    owid = datasets_dict['owid']
    oxford = datasets_dict['oxford']
    oxford_nice = datasets_dict['oxford_nice']

    # get the intersection window: LARGEST min, and SMALLEST max
    min_date = max(owid['date'].min(), oxford['date'].min())
    max_date = min(owid['date'].max(), oxford['date'].max())

    # set max_date = 2 weeks ago
    # Reason: there is sometimes a bit of a lag between the date and when data are finally updated. 
    # This way we can reduce NAs at the end of the dataset
    max_date = max_date - pd.to_timedelta(14, unit='d')

    print(f'intersection window of dates: {min_date} to {max_date}', flush=True)

    rows_dropped_owid = owid.query('(date < @min_date) or (date > @max_date)').shape[0]
    rows_dropped_oxford = oxford.query('(date < @min_date) or (date > @max_date)').shape[0]
    rows_dropped_oxford_nice = oxford_nice.query('(date < @min_date) or (date > @max_date)').shape[0]

    if rows_dropped_owid > 0 or rows_dropped_oxford > 0 or rows_dropped_oxford_nice > 0:
        print('\nDropping rows to align date windows----------------', flush=True)

        print('Before drop:', flush=True)
        print(f'    OWID: {datasets_dict["owid"].shape[0]} rows', flush=True)
        print(f'    Oxford: {datasets_dict["oxford"].shape[0]} rows', flush=True)
        print(f'    Oxford_nice: {datasets_dict["oxford_nice"].shape[0]} rows', flush=True)

        print('Plan to drop:', flush=True)
        print(f'    OWID: {rows_dropped_owid} rows', flush=True)
        print(f'    Oxford: {rows_dropped_oxford} rows', flush=True)
        print(f'    Oxford_nice: {rows_dropped_oxford_nice} rows', flush=True)

        datasets_dict['owid'] = owid.query('(date >= @min_date) and (date <= @max_date)')
        datasets_dict['oxford'] = oxford.query('(date >= @min_date) and (date <= @max_date)')
        datasets_dict['oxford_nice'] = oxford_nice.query('(date >= @min_date) and (date <= @max_date)')

        print('Done. After drop:', flush=True)
        print(f'    OWID: {datasets_dict["owid"].shape[0]} rows', flush=True)
        print(f'    Oxford: {datasets_dict["oxford"].shape[0]} rows', flush=True)
        print(f'    Oxford_nice: {datasets_dict["oxford_nice"].shape[0]} rows', flush=True)

    print("\nDone\n", flush=True)


def intersect_countries(datasets_dict):
    print("Filtering out countries that don't exist in both datasets...", flush=True)

    owid = datasets_dict['owid']
    oxford = datasets_dict['oxford']
    oxford_nice = datasets_dict['oxford_nice']

    owid_countries = owid['location'].unique()
    oxford_countries = oxford['countryname'].unique()
    intersect_countries = [x for x in owid_countries if x in oxford_countries]

    print("Countries in oxford, but not in OWID:", flush=True)
    print([x for x in oxford_countries if x not in owid_countries], flush=True)

    print("countries in OWID, but not in oxford", flush=True)
    print([x for x in owid_countries if x not in oxford_countries], flush=True)

    rows_dropped_owid = owid[~owid['location'].isin(intersect_countries)].shape[0]
    rows_dropped_oxford = oxford[~oxford['countryname'].isin(intersect_countries)].shape[0]
    rows_dropped_oxford_nice = oxford_nice[~oxford_nice['countryname'].isin(intersect_countries)].shape[0]

    if rows_dropped_owid > 0 or rows_dropped_oxford > 0 or rows_dropped_oxford_nice > 0:
        print("\nDropping rows for countries that don't exist in both datasets----------------", flush=True)

        print('Before drop:', flush=True)
        print(f'    OWID: {owid.shape[0]} rows', flush=True)
        print(f'    Oxford: {oxford.shape[0]} rows', flush=True)
        print(f'    Oxford_nice: {oxford_nice.shape[0]} rows', flush=True)

        print('Plan to drop:', flush=True)
        print(f'    OWID: {rows_dropped_owid} rows', flush=True)
        print(f'    Oxford: {rows_dropped_oxford} rows', flush=True)
        print(f'    Oxford_nice: {rows_dropped_oxford_nice} rows', flush=True)

        datasets_dict['owid'] = owid[owid['location'].isin(intersect_countries)]
        datasets_dict['oxford'] = oxford[oxford['countryname'].isin(intersect_countries)]
        datasets_dict['oxford_nice'] = oxford_nice[oxford_nice['countryname'].isin(intersect_countries)]

        print('Done. After drop:', flush=True)
        print(f'    OWID: {datasets_dict["owid"].shape[0]} rows', flush=True)
        print(f'    Oxford: {datasets_dict["oxford"].shape[0]} rows', flush=True)
        print(f'    Oxford_nice: {datasets_dict["oxford_nice"].shape[0]} rows', flush=True)

    print("\nDone\n", flush=True)


def remove_regional_data(datasets_dict):
    print("Filtering out regional data in Oxford dataset...", flush=True)

    owid = datasets_dict['owid']
    oxford = datasets_dict['oxford']
    oxford_nice = datasets_dict['oxford_nice']

    rows_dropped_owid = 0
    rows_dropped_oxford = oxford[~oxford['regionname'].isna()].shape[0]
    rows_dropped_oxford_nice = oxford_nice[~oxford_nice['regionname'].isna()].shape[0]

    if rows_dropped_owid > 0 or rows_dropped_oxford > 0 or rows_dropped_oxford_nice > 0:
        print("\nDropping rows to remove regional data----------------", flush=True)

        print('Before drop:', flush=True)
        print(f'    OWID: {owid.shape[0]} rows', flush=True)
        print(f'    Oxford: {oxford.shape[0]} rows', flush=True)
        print(f'    Oxford_nice: {oxford_nice.shape[0]} rows', flush=True)

        print('Plan to drop:', flush=True)
        print(f'    OWID: {rows_dropped_owid} rows', flush=True)
        print(f'    Oxford: {rows_dropped_oxford} rows', flush=True)
        print(f'    Oxford_nice: {rows_dropped_oxford_nice} rows', flush=True)

        datasets_dict['oxford'] = oxford[oxford['regionname'].isna()]
        datasets_dict['oxford_nice'] = oxford_nice[oxford_nice['regionname'].isna()]

        print('Done.', flush=True)
        print(f'OWID: {datasets_dict["owid"].shape[0]} rows', flush=True)
        print(f'Oxford: {datasets_dict["oxford"].shape[0]} rows', flush=True)
        print(f'Oxford_nice: {datasets_dict["oxford_nice"].shape[0]} rows', flush=True)

    print("\nDone\n", flush=True)


def merge_datasets(datasets_dict):
    print("Merging the OWID and oxford datasets...", flush=True)

    owid = datasets_dict['owid']
    oxford = datasets_dict['oxford']
    oxford_nice = datasets_dict['oxford_nice']

    df = oxford.merge(owid, how="left", left_on=['countryname', 'date'], right_on=['location', 'date']) \
            .merge(oxford_nice[['countryname', 'date', 'e3_fiscal measures', 'e4_international support', 
                                'h4_emergency investment in healthcare', 'h5_investment in vaccines']],
                    on=['countryname', 'date'])

    print(f"\nShape after merging: {df.shape}", flush=True)
    print("\nDone\n", flush=True)
    return df


def update_filler_rows(df):
    #### Update OWID variables' "filler" rows
    # More info: The Oxford dataset has rows for every country for the entire date range 
    # of the dataset, even if they don't have data for the country on the given date. 
    # The OWID data only has a row for a country if it has data for it. So when the datasets 
    # are joined, the columns that are constant in OWID (like median_age, extreme_poverty, etc.) are 
    # filled with missing values. Below we will populate those missing values with the non-missing values 
    # from other rows (since the values are constant anyway).

    # For the new "filler rows" in OWID, for the static attributes that don't change (e.g., median_age), 
    # update all NAs to be equal to the country's max/min/first value
    print("Updating filler rows...", end="", flush=True)
    filler_cols = ["continent", "population", "population_density", "median_age", "aged_65_older", "aged_70_older",
                   "gdp_per_capita", "extreme_poverty", "cardiovasc_death_rate", "diabetes_prevalence",
                   "female_smokers", "male_smokers", "handwashing_facilities", "hospital_beds_per_thousand",
                   "life_expectancy", "human_development_index"]

    # replace missing values with "" before aggregating; otherwise string columns like "continent" will 
    # cause an error when comparing strings with NaN, saying you can't compare a float and a string
    str_cols = [x for x in df.columns if df[x].dtype == "object"]
    tmp = df.fillna({x: "" for x in str_cols})

    filler_values = tmp.groupby('countryname').agg({x: 'max' for x in filler_cols}).reset_index()

    # merge in the filler data
    sort_order = df.columns
    data_cols = [x for x in df.columns if x not in filler_cols]
    df = df[data_cols].merge(filler_values, how="left", on="countryname")[sort_order]
    print("Done\n", flush=True)

    return df


def recode_oxford_vars(df):
    print("Recoding Oxford variables...", end="", flush=True)
    ## re-code 4 oxford variables without flags, and 2 that have special variables
    
    #### these variables don't have a flag, so are applied to the whole country. Let's apply a "G" 
    # to the end of the values to match the formatting of the other "combined" variables.
    cols = ['e2_combined', 'h2_combined', 'h3_combined', 'c8_combined',]

    # create a numeric version of these columns for consistency
    for col in cols:
        df[col + "_numeric"] = df[col]

    def add_g(x):
        if np.isnan(x):
            return x
        if x == 0:
            return "0"
        else:
            return str(int(x)) + "G"

    df[cols] = df[cols].applymap(add_g)

    #### now update e1_combined and h7_combined, which have special values
    # update h7_combined to set "1I" = "1G"; we will recode in a bit
    df.loc[df["h7_combined"]=="1I", "h7_combined"] = "1G"

    # update e1_combined to set "1A" = "1G", "2A" = "2G", "1F" = "1T", "2F" = "2T"; we will recode in a bit
    df.loc[df["e1_combined"].str.slice(1)=="F", "e1_combined"] = \
        df.loc[df["e1_combined"].str.slice(1)=="F", "e1_combined"].str.slice(0, 1) + "T"

    df.loc[df["e1_combined"].str.slice(1)=="A", "e1_combined"] = \
        df.loc[df["e1_combined"].str.slice(1)=="A", "e1_combined"].str.slice(0, 1) + "G"

    print("Done\n", flush=True)


def recode_GT(df):
    print("Recoding G/T variables...", flush=True)

    ## Re-code from "G"/"T" to "National"/"Local" so alphabetic ordering matches numeric ordering
    # e.g., 2.5 is "3-Local" (was "3T") and 3.0 is "3-National" (was "3G")

    def recode(x):
        try:
            if pd.isna(x) or x in ["0", "", "(missing)"]:
                return x
            if type(x) in [int, float]:  # h8_combined has 0.0
                return str(round(x))
            if x[-1:] == "G":
                return x[:-1] + "-National"
            elif x[-1:] == "T":
                return x[:-1] + "-Local"
            else:
                print(x)
                raise RuntimeError("Issue with recoding variable")
        except:
            print(x)
            raise

    cols = [x for x in df.columns if x[-9:]=="_combined"]
    df[cols] = df[cols].applymap(recode)

    for col in cols:
        print(df[col].value_counts(), flush=True)

    print("\nDone\n", flush=True)

def drop_unnecessary_columns(df):
    print("Dropping unnecessary columns...", end="", flush=True)

    ## drop unnecessary columns, and rename others to nicer names
    cols_to_drop = [
        'countrycode',  # this and below are from oxford
        'regionname',
        'regioncode',
        'jurisdiction',
        'confirmedcases',
        'confirmeddeaths',
        'stringencyindexfordisplay',
        'stringencylegacyindex',
        'stringencylegacyindexfordisplay',
        'governmentresponseindexfordisplay',
        'containmenthealthindexfordisplay',
        'economicsupportindexfordisplay',
        'location',  # this and the next are from owid
        'iso_code_x',  # original ISO code from OWID; will be replaced by codes in countries_iso.csv
        'stringency_index',
    ]

    df.drop(columns=cols_to_drop, inplace=True)
    print("Done\n", flush=True)


def rename_columns(df):
    print("Renaming columns...", end="", flush=True)

    rename_cols = {
        'c1_combined': 'c1_school_closing',
        'c1_combined_numeric': 'c1_school_closing_numeric',

        'c2_combined': 'c2_workplace_closing',
        'c2_combined_numeric': 'c2_workplace_closing_numeric',

        'c3_combined': 'c3_cancel_public_events',
        'c3_combined_numeric': 'c3_cancel_public_events_numeric',

        'c4_combined': 'c4_restrictions_on_gatherings',
        'c4_combined_numeric': 'c4_restrictions_on_gatherings_numeric',

        'c5_combined': 'c5_close_public_transport',
        'c5_combined_numeric': 'c5_close_public_transport_numeric',

        'c6_combined': 'c6_stay_at_home_requirements',
        'c6_combined_numeric': 'c6_stay_at_home_requirements_numeric',

        'c7_combined': 'c7_restrictions_on_internal_movement',
        'c7_combined_numeric': 'c7_restrictions_on_internal_movement_numeric',

        'c8_combined': 'c8_international_travel_controls',
        'c8_combined_numeric': 'c8_international_travel_controls_numeric',

        'e1_combined': 'e1_income_support',
        'e1_combined_numeric': 'e1_income_support_numeric',

        'e2_combined': 'e2_debt_contract_relief',
        'e2_combined_numeric': 'e2_debt_contract_relief_numeric',

        'h1_combined': 'h1_public_information_campaigns',
        'h1_combined_numeric': 'h1_public_information_campaigns_numeric',

        'h2_combined': 'h2_testing_policy',
        'h2_combined_numeric': 'h2_testing_policy_numeric',

        'h3_combined': 'h3_contact_tracing',
        'h3_combined_numeric': 'h3_contact_tracing_numeric',

        'h6_combined': 'h6_facial_coverings',
        'h6_combined_numeric': 'h6_facial_coverings_numeric',

        'h7_combined': 'h7_vaccination_policy',
        'h7_combined_numeric': 'h7_vaccination_policy_numeric',

        'e3_fiscal measures': 'e3_fiscal_measures',
        'e4_international support': 'e4_international_support',
        'h4_emergency investment in healthcare': 'h4_emergency_investment_in_healthcare',
        'h5_investment in vaccines': 'h5_investment_in_vaccines',

        'stringencyindex': 'stringency_index',
        'governmentresponseindex': 'government_response_index',
        'containmenthealthindex': 'containment_health_index',
        'economicsupportindex': 'economic_support_index',
        'iso_code_y': 'iso_code'
    }

    df.rename(columns=rename_cols, inplace=True)
    print("Done\n", flush=True)


def add_iso_codes(df):
    #### Add ISO Codes (alpha-3)
    # This is for joining to mapbox vector data. ISO codes were taken from https://gist.github.com/tadast/8827699, 
    # and I merged them with our country names. There were some differences in country names, and a couple missing 
    # ISO codes in the github file (e.g., for Kosovo) which I filled in using google.
    print("Adding ISO codes...", flush=True)
    iso_codes = pd.read_csv("countries_iso.csv")
    
    print(f"\nShape before adding ISO codes: {df.shape}", flush=True)
    df = df.merge(iso_codes, how="inner", left_on="countryname", right_on="country").drop(columns=["country"])
    print(f"\nShape after adding ISO codes: {df.shape}", flush=True)

    print("\nDone\n", flush=True)
    return df


def summarize_dataset(df, return_df=True, output_summary=True, filename=None):
    """Univariate summary of all variables in a dataframe

    Args:
        df (pandas DataFrame): data to summarize
        return_df (bool, optional): Whether to return the summary as a DataFrame. Defaults to True.
        output_summary (bool, optional): Whether to export the summary to a file. Defaults to True.
        filename (str, optional): Filename to export. Defaults to None.
    
    Returns:
        pandas DataFrame: Summarized data
    """
    print("Summarizing final dataset...", end="", flush=True)

    var_summary = df.describe(include="all").T
    var_summary["type"] = ['str' if str(x) == "object" else "date" if "date" in str(x) else str(x) for x in df.dtypes]
    var_summary["missing_pct"] = 1 - var_summary["count"] / len(df)
    var_summary["col_number"] = np.arange(1, df.shape[1] + 1)

    # move these columns to the front
    front_cols = ["col_number", "type", "count", "missing_pct", "unique"]
    var_summary = var_summary[[*front_cols, *[x for x in var_summary.columns if x not in front_cols]]]

    if output_summary:
        the_time = datetime.now().strftime("%Y%m%d")

        if filename is None:
            filename = os.path.join(os.getcwd(), "var_summary_" + the_time + ".csv")
        
        var_summary.to_csv(filename, index=True, index_label="variable", quoting=csv.QUOTE_ALL)

    print("Done\n", flush=True)
    
    if return_df:
        return var_summary


if __name__ == "__main__":
    ## Important note: even after preprocessing and filtering to get OWID and Oxford in alignment,
    ## they will still be far apart in row counts because OWID data does doesn't include filler rows 
    ## for every country even when there were no data.

    datasets = download_data()
    datasets_dict = {'owid': datasets[0], 'oxford': datasets[1], 'oxford_nice': datasets[2]}

    lowercase_column_names(datasets)
    reformat_dates(datasets[1:])  # not OWID
    convert_dates(datasets)
    intersect_dates(datasets_dict)
    intersect_countries(datasets_dict)
    remove_regional_data(datasets_dict)
    df = merge_datasets(datasets_dict)
    df = add_iso_codes(df)
    df = update_filler_rows(df)
    recode_oxford_vars(df)
    recode_GT(df)
    df['new_vaccinations_per_hundred'] = df['new_vaccinations'] / df['population'] * 100

    drop_unnecessary_columns(df)
    rename_columns(df)

    #### Re-encode dates as string for output to CSV
    df['date'] = df.apply(lambda x: x['date'].strftime('%Y-%m-%d'), axis=1)

    #### Export dataset to CSV
    the_date = datetime.now().strftime('%Y%m%d-%H%M%S')
    df.to_csv(f'covid_data_{the_date}.csv', index=False)

    _ = summarize_dataset(df)
    print(f"\nFinal output shape: {df.shape}", flush=True)
