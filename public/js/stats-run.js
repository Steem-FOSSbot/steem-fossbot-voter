function gotoOverview() {
	window.location.href = "/stats";
}

function getKey() {
	var key = "";
	var parts = window.location.href.split("&");
	for (var i = 0 ; i < parts.length ; i++) {
		var idx = parts[i].search("pd_key=");
		if (idx >= 0) {
			key = parts[i].substring(idx + 7, parts[i].length);
		}
	}
	return key;
}

function loadChart() {
	$.getJSON( "/stats-data-json?session_key="+getCookie("session_key")+"&pd_key="+getKey(), function(data) {
		var xTicks = ['x'];
		var numData_score_total = ['Total score'];
		var numData_threshold = ['Threshold'];
    var numData_min = ['Minimum'];
		var numData_metrics = [];
		var metricsNames = [];
		// first, create metrics arrays
		// metrics
		var metrics = data.postsMetadata[0].scoreDetail.metrics;
		for (var i = 1 ; i < data.postsMetadata.length ; i++) {
			if (data.postsMetadata[i].scoreDetail.metrics.length > metrics.length) {
				metrics = data.postsMetadata[i].scoreDetail.metrics;
			}
		}
		for (var j = 0 ; j < metrics.length ; j++) {
			numData_metrics.push([metrics[j].key]);
			metricsNames.push(metrics[j].key);
		}
		for (var i = 0 ; i < data.postsMetadata.length ; i++) {
			xTicks.push(data.postsMetadata[i].title);
			numData_score_total.push(data.postsMetadata[i].score.toFixed(2));
			numData_threshold.push(data.postsMetadata[i].thresholdInfo.total.toFixed(2));
      numData_min.push(data.postsMetadata[i].thresholdInfo.hasOwnProperty("min") ? data.postsMetadata[i].thresholdInfo.min.toFixed(2) : 0);
			// metrics
			metrics = data.postsMetadata[i].scoreDetail.metrics;
			for (var j = 0 ; j < metricsNames.length ; j++) {
				var match = false;
				for (var k = 0 ; k < metrics.length ; k++) {
					if (metrics[k].key.localeCompare(metricsNames[j]) == 0) {
						numData_metrics[j].push(metrics[k].score.toFixed(2));
						match = true;
						break;
					}
				}
				if (!match) {
					numData_metrics[j].push(0);
				}
			}
		}
		// combine data to columns for metrics data
		var chart_score_breakdown_columns = [xTicks];
		for (var i = 0 ; i < numData_metrics.length ; i++) {
			chart_score_breakdown_columns.push(numData_metrics[i]);
		}
		var chart_posts = c3.generate({
		    bindto: '#chart_score_summary',
		    size: {
		        height: 600
		    },
		    data: {
		    	x : 'x',
		    	columns: [
		    		xTicks,
		    		numData_score_total,
		    		numData_threshold,
            numData_min
		    	],
		    	type: 'bar',
		    	types: {
		    		Threshold: 'area',
            Minimum: 'area'
		    	},
		    	colors: {
		    		'Total score': '#1f77b4',
		    		Threshold: '#ff7f0e',
						Minimum: '#7f7f7f'
		    	}
		    },
		    bar: {
		    	width: {
		    		ratio: 0.3
		    	}
		    },
    		axis: {
		        x: {
		            type: 'category',
		            tick: {
		                rotate: 90,
		                multiline: false
		            },
		            height: 300
		        }
		    },
		    legend: {
		        position: 'right'
		    },
		    color: {
    			pattern: ['#1f77b4']
    		}
		});
		var chart_posts = c3.generate({
		    bindto: '#chart_score_breakdown',
		    data: {
		    	x : 'x',
		    	columns: chart_score_breakdown_columns,
		    	type: 'bar',
		    	groups: [metricsNames]
		    },
		    bar: {
		    	width: {
		    		ratio: 0.5
		    	}
		    },
    		color: {
    			pattern: ['#1f77b4']
    		},
    		axis: {
		        x: {
		            type: 'category',
		            tick: {
		                rotate: 90,
		                multiline: false
		            },
		            height: 300
		        }
		    },
		    legend: {
		        position: 'right'
		    },
		    color: {
		        pattern: ['#9e33ff',
              '#f900ff',
              '#ff006b',
              '#ff1d00',
              '#ff5f00',
              '#ffd400',
              '#96ff00',
              '#00ff09',
              '#00ff9d',
              '#00b8ff',
              '#5259ff',
              '#8b8579',
              '#000000'
						]
		    }
		});
	});
}

window.onload = loadChart;

function getCookie(cname) {
  console.log("getCookie: all cookies: "+document.cookie);
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
  }
  return "";
}