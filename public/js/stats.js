function loadChart() {
	$.getJSON( "/stats-data-json?api_key="+getApiKey(window.location.href)+"&summary=true", function(data) {
		var numPostsData = ['Num posts'];
		var numVotesData = ['Num votes'];
		for (var i = 0 ; i < data.summary.length ; i++) {
			numPostsData.push(data.summary[i].num_posts);
			numVotesData.push(data.summary[i].num_votes);
		}
		var chart = c3.generate({
		    bindto: '#chart',
		    data: {
		      columns: [
		        numPostsData,
		        numVotesData
		      ],
		      type: 'bar'
		    },
		    bar: {
		    	width: {
		    		ratio: 0.5
		    	}
		    }
		});
	});
}

window.onload = loadChart;

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