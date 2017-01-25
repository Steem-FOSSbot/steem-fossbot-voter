function loadChart() {
	$.getJSON( "/stats-data-json?session_key="+getCookie("session_key")+"&summary=true", function(data) {
		var numPostsData = ['Num posts processed'];
		var numVotesData = ['Num votes cast'];
		var timeSeries = ['x'];
		var dayRegions = [];
		var lastDay = -1;
		var regionOn = false;
		var start = -1;
		for (var i = 0 ; i < data.summary.length ; i++) {
			numPostsData.push(data.summary[i].num_posts);
			numVotesData.push(data.summary[i].num_votes);
			timeSeries.push(data.summary[i].date_str);
			if (data.summary[i].date_day != lastDay) {
        lastDay = data.summary[i].date_day;
        regionOn = !regionOn;
        if (regionOn) {
          start = i;
				} else {
          dayRegions.push({axis: 'x', start: start, end: (i - 1), class: 'regionX'});
          start = -1;
				}
			}
		}
    if (start >= 0) {
      dayRegions.push({axis: 'x', start: start, end: (data.summary.length - 1), class: 'regionX'});
    }
		console.log("dayRegions: "+JSON.stringify(dayRegions));
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
				regions: dayRegions,
				axis: {
					x: {
						type: 'category',
						tick: {
							rotate: 90,
							multiline: false
						}
					}
				},
		    bar: {
		    	width: {
		    		ratio: 0.4
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
      	regions: dayRegions,
				axis: {
					x: {
						type: 'category',
						tick: {
							rotate: 90,
							multiline: false
						}
					}
				},
		    bar: {
		    	width: {
		    		ratio: 0.4
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