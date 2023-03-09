"use strict";

// Get data from csv file
var internet_users = Papa.parse("users-by-country.csv", {
  header: true,
  download: true,
  dynamicTyping: true,
  complete: function (results) {
    internet_users = results.data;
    init();
  },
});

function years() {
  let year = [];
  for (let i = 0; i < internet_users.length; i++) {
    year.push(internet_users[i].Year);
  }
  year = [...new Set(year)];
  year.sort((a, b) => a - b);
  return year;
}

function countries(year_snapshot) {
  let country = [];
  for (let i = 0; i < year_snapshot.length; i++) {
    country.push(year_snapshot[i].Entity);
  }
  country = [...new Set(country)];
  return country;
}

function getCommonCountries(previous_year_snapshot, year_snapshot) {
  let previous_year_countries = countries(previous_year_snapshot);
  let year_countries = countries(year_snapshot);

  let country = [];
  for (let i = 0; i < year_countries.length; i++) {
    if (previous_year_countries.includes(year_countries[i])) {
      country.push(year_snapshot[i].Entity);
    }
  }
  country = [...new Set(country)];
  return country;
}

function getSharedSnapshots(common_countries, compared_countries) {
  let snapshots = [];
  for (let i = 0; i < compared_countries.length; i++) {
    if (common_countries.includes(compared_countries[i].Entity)) {
      snapshots.push(compared_countries[i]);
    }
  }
  snapshots = [...new Set(snapshots)];
  return snapshots;
}

function getSnapshots(animated, i) {
  var snapshots;

  if (animated) {
    console.log(i + "\t" + years()[i]);
    snapshots = internet_users.filter((d) => d.Year == years()[i]);
  } else {
    snapshots = internet_users.filter(
      (d) => d.Year == document.getElementById("selectYear").value
    );
  }

  // Work off of a deep copy of the array
  snapshots = structuredClone(snapshots);

  if (document.getElementById("displayMode").value === "growth") {
    snapshots = getGrowthSnapshots(snapshots, animated, i);
  }

  return snapshots;
}

function getGrowthSnapshots(snapshots, animated, i) {
  var previous_year_snapshots;
  if (animated) {
    // Get all snapshots from currently animated year
    previous_year_snapshots = internet_users.filter(
      (d) => d.Year == years()[i] - 1
    );
  } else {
    // Get all snapshots from the year preceding the currently selected year
    previous_year_snapshots = internet_users.filter(
      (d) => d.Year == document.getElementById("selectYear").value - 1
    );
  }
  previous_year_snapshots = structuredClone(previous_year_snapshots);

  // Find all countries that have data for both the current year and the preceding year
  let common_countries = getCommonCountries(previous_year_snapshots, snapshots);

  // Refine each set of snapshots to only countries that have data for both years
  snapshots = [...new Set(getSharedSnapshots(common_countries, snapshots))];
  previous_year_snapshots = [
    ...new Set(getSharedSnapshots(common_countries, previous_year_snapshots)),
  ];

  // If displaying user growth, subtract previous year users from current year
  for (let i = 1; i < snapshots.length; i++) {
    snapshots[i].Users = snapshots[i].Users - previous_year_snapshots[i].Users;
  }

  return snapshots;
}

function createOptions() {
  var select = document.getElementById("selectYear");
  select.innerHTML = "";

  // Do not allow the user to select the first year if displaying growth
  var i;
  document.getElementById("displayMode").value == "growth" ? (i = 1) : (i = 0);

  for (i; i < years().length - 1; i++) {
    var option = document.createElement("option");
    option.text = years()[i];
    select.add(option);
  }
  document.getElementById("selectYear").innerHTML = select.innerHTML;

  select = document.getElementById("selectRank");
  select.innerHTML = "";

  var options = [3, 5, 10, 20];
  for (let i = 0; i < options.length; i++) {
    var option = document.createElement("option");
    option.text = options[i];
    select.add(option);
  }
  document.getElementById("selectRank").innerHTML = select.innerHTML;
}

function keepTop(data, top) {
  let topData = [];
  for (let i = 0; i < data.length; i++) {
    topData.push(data[i]);
    if (topData.length > top) {
      topData.sort((a, b) => b.users - a.users);
      topData.pop();
    }
  }
  return topData;
}

function updateVisual() {
  let snapshots = getSnapshots(false);
  var ranking = document.getElementById("selectRank").value;

  var chart_title, x_axis_label;

  if (document.getElementById("displayMode").value == "growth") {
    chart_title =
      "Top " +
      ranking +
      " countries by internet user growth in the year " +
      snapshots[0].Year;
    x_axis_label =
      "Number of new internet users in the year " + snapshots[0].Year;
  } else {
    chart_title =
      "Top " +
      ranking +
      " countries by total internet users in the year " +
      snapshots[0].Year;
    x_axis_label = "Total internet users in the year " + snapshots[0].Year;
  }

  var spec = {
    title: {
      text: chart_title,
    },
    width: 600,
    data: {
      values: snapshots.map((d) => {
        return {
          entity: d.Entity,
          users: d.Users,
        };
      }),
    },
    encoding: {
      x: {
        field: "users",
        type: "quantitative",
        title: x_axis_label,
      },
      y: {
        field: "entity",
        type: "nominal",
        title: "Country",
        sort: {
          field: "users",
          op: "sum",
          order: "descending",
        },
      },
    },
    layer: [
      {
        mark: {
          type: "bar",
          color: "darkgreen",
        },
      },
      {
        mark: {
          type: "text",
          align: "left",
          baseline: "middle",
          dx: 3,
        },
        encoding: {
          text: {
            field: "users",
            type: "quantitative",
            format: ".2s",
          },
        },
      },
    ],
  };
  spec.data.values = spec.data.values.filter((d) => d.entity != "World");
  spec.data.values = keepTop(spec.data.values, ranking);
  vegaEmbed("#vis", spec);
}

function init() {
  createOptions();
  updateVisual();
}

function playAnimation() {
  // set innerHTML of button to vis2 to display loading animation
  document.getElementById("vis").innerHTML = "Loading...";
  var snapshots, ranking, spec;

  var chart_title, x_axis_label;

  for (let i = 0; i < years().length - 1; i++) {
    // Skip the first year if showing growth
    if (document.getElementById("displayMode").value == "growth" && i == 0)
      continue;

    setTimeout(function () {
      let snapshots = getSnapshots(true, i);

      if (document.getElementById("displayMode").value == "growth") {
        chart_title =
          "Top " +
          ranking +
          " countries by internet user growth in the year " +
          snapshots[0].Year;
        x_axis_label =
          "Number of new internet users in the year " + snapshots[0].Year;
      } else {
        chart_title =
          "Top " +
          ranking +
          " countries by total internet users in the year " +
          snapshots[0].Year;
        x_axis_label = "Total internet users in the year " + snapshots[0].Year;
      }

      ranking = document.getElementById("selectRank").value;
      spec = {
        title: {
          text: chart_title,
        },
        width: 600,
        data: {
          values: snapshots.map((d) => {
            return {
              entity: d.Entity,
              users: d.Users,
            };
          }),
        },
        encoding: {
          x: {
            field: "users",
            type: "quantitative",
            title: x_axis_label,
          },
          y: {
            field: "entity",
            type: "nominal",
            title: "Country",
            sort: {
              field: "users",
              op: "sum",
              order: "descending",
            },
          },
        },
        layer: [
          {
            mark: {
              type: "bar",
              color: "darkgreen",
            },
          },
          {
            mark: {
              type: "text",
              align: "left",
              baseline: "middle",
              dx: 3,
            },
            encoding: {
              text: {
                field: "users",
                type: "quantitative",
                format: ".2s",
              },
            },
          },
        ],
      };
      spec.data.values = spec.data.values.filter((d) => d.entity != "World");
      spec.data.values = keepTop(spec.data.values, ranking);
      vegaEmbed("#vis", spec);
    }, 5000);
  }
}
