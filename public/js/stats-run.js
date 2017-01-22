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
		var numData_score_total = ['Total score'];
		for (var i = 0 ; i < data.postsMetadata.length ; i++) {
			numData_score_total.push(data.postsMetadata[i].score);
		}
		var chart_posts = c3.generate({
		    bindto: '#chart',
		    data: {
		    	columns: [
		    		numData_score_total
		    	],
		    	type: 'bar'
		    },
		    bar: {
		    	width: {
		    		ratio: 0.2
		    	}
		    },
    		color: {
    			pattern: ['#1f77b4']
    		}
		});
	});
}

window.onload = loadChart;