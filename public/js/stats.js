function loadChart() {
	$.getJSON( "/stats-data-json?session_key="+getCookie("session_key")+"&summary=true", function(data) {
		var numPostsData = ['Num posts processed'];
		var numVotesData = ['Num votes cast'];
		var timeSeries = ['x'];
		for (var i = 0 ; i < data.summary.length ; i++) {
			numPostsData.push(data.summary[i].num_posts);
			numVotesData.push(data.summary[i].num_votes);
			timeSeries.push(data.summary[i].date);
		}
		var chart_posts = c3.generate({
		    bindto: '#chart_posts',
		    data: {
		    	x: 'x',
		    	columns: [
		    		timeSeries,
		    		numPostsData
		    	],
		    	type: 'bar'
		    },
		    axis: {
		    	x: {
		    		type: 'timeseries',
		    		localtime: true,
		    		tick: {
		    			format: '%Y-%m-%d %H:%M:%S'
		    		}
		    	}
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
		var chart_votes = c3.generate({
		    bindto: '#chart_votes',
		    data: {
		    	x: 'x',
		    	columns: [
		    		timeSeries,
		    		numVotesData
		    	],
		    	type: 'bar'
		    },
		    axis: {
		    	x: {
		    		type: 'timeseries',
		    		localtime: true,
		    		tick: {
		    			format: '%Y-%m-%d %H:%M:%S'
		    		}
		    	}
		    },
		    bar: {
		    	width: {
		    		ratio: 0.2
		    	}
		    },
    		color: {
    			pattern: ['#ff7f0e']
    		}
		});
	});
}

window.onload = loadChart;

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
  }
  return "";
}