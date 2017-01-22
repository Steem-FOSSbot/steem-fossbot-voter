function demoChart() {
	$.getJSON( "//stats-data-json?api_key="+getApiKey(window.location.href)+"&summary=true", function(data) {
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

window.onload = demoChart;