var path = "./french-articles/BAGUETTE_sales.csv";
var title = "Sales of a BAGUETTE";

function loadVisual() {
    var input = document.querySelectorAll('input[type="checkbox"]:checked');
    var months = [];
    for (var i = 0; i < input.length; i++) {
        months.push(input[i].value);
    }
    var spec = {
        "data": {
            "url": path,
        },
        "repeat": {
            "layer": months,
        },
        "spec": {
            "title": title,
            "mark": {
                "type": "area",
                "point": {
                    "filled": false,
                    "fill": "white",
                },
                "tooltip": true,
                "interpolate": "monotone",
                "line": true,
                "opacity": .6
            },
            "encoding": {
                "x": {
                    "title": "Day of the Week",
                    "field": "day_of_week",
                    "type": "ordinal",
                    "axis": {"labelAngle": -45},
                    "sort": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                },
                "y": {
                    "title": "Sales in €",
                    "field": {"repeat": "layer"},
                    "type": "quantitative",
                },
                "color": {
                    "datum": {"repeat": "layer"},
                    "type": "nominal",
                },
            },
            // set width to size of the viewpane
            "width": "container",
            "height": 400,
        }
    };
    vegaEmbed('#vis', spec);
}

function changeData(data) {
    path = "./french-articles/" + data + "_sales.csv";
    title = "Sales of a " + data;
    loadVisual();
}

loadVisual();