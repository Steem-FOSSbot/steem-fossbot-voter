function gotoOverview() {
	window.location.href = "/stats?api_key="+getApiKey(window.location.href);
}

function getApiKey(url) {
	var apiKey = "";
	var parts = window.location.href.split("&");
	for (var i = 0 ; i < parts.length ; i++) {
		var idx = parts[i].search("api_key=");
		if (idx >= 0) {
			var apiKey = parts[i].substring(idx + 8, parts[i].length);
		}
	}
	return apiKey;
}

function getKey(url) {
	var apiKey = "";
	var parts = window.location.href.split("&");
	for (var i = 0 ; i < parts.length ; i++) {
		var idx = parts[i].search("pd_key=");
		if (idx >= 0) {
			var apiKey = parts[i].substring(idx + 7, parts[i].length);
		}
	}
	return apiKey;
}

function loadChart() {
	$.getJSON( "/stats-data-json?api_key="+getApiKey(window.location.href)+"&pd_key="+getKey(), function(data) {
		var xTicks = ['x'];
		var numData_score_total = ['Total score'];
		var numData_threshold = ['Threshold'];
		var numData_metrics = [];
		var metricsNames = [];
		// first, create metrics arrays
		// metrics
		var metrics = data.postsMetadata[0].scoreDetail.metrics;
		for (var j = 0 ; j < metrics.length ; j++) {
			numData_metrics.push([metrics[j].key]);
			metricsNames.push(metrics[j].key);
		}
		for (var i = 0 ; i < data.postsMetadata.length ; i++) {
			xTicks.push(data.postsMetadata[i].title);
			numData_score_total.push(data.postsMetadata[i].score);
			numData_threshold.push(data.postsMetadata[i].thresholdInfo.total);
			// metrics
			metrics = data.postsMetadata[i].scoreDetail.metrics;
			for (var j = 0 ; j < metrics.length ; j++) {
				numData_metrics[j].push(metrics[j].score);
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
		    		numData_threshold
		    	],
		    	type: 'bar'
		    },
		    bar: {
		    	width: {
		    		ratio: 0.3
		    	}
		    },
    		color: {
    			pattern: ['#1f77b4', '#ff7f0e']
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
		        position: 'top'
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
		        position: 'top'
		    },
		    color: {
		        pattern: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
		    }
		});
	});
}

window.onload = loadChart;