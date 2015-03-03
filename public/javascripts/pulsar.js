/** Create a new pulsar instance for the given feed */
window.Pulsar = function (file) {
  this.file = file;
  this.height = 800;
  this.width = 1200;
  //this.range = [0, 24]; 	//changed to be compatible with 0300 - 2700 transit day
  this.range = [3, 27]; 	//changed to be compatible with 0300 - 2700 transit day
};

window.Pulsar.prototype = {
  setRoute: function (route) {
    this.route = route;
    this.direction = 1;   //displays inbound routes by default on load.  
    this.fetchData();
  },

  fetchData: function () {
    var instance = this;

    d3.json("transfers/" + this.file + "/" + this.route + "/" + this.direction, function (error, data) {
      instance.data = data;
      instance.redraw();
    });
  },

  toggleDirection: function () {
    this.direction = this.direction !== 0 ? 0 : 1;
    this.fetchData();
  },

  setRange: function (range) {
    this.range = range;
    this.redraw();
  },

  formatTime: function (time) {
    var hrs = Math.floor(time);
    var mins = Math.round((time - hrs) * 60);

    mins = mins < 10 ? '0' + mins : mins;
    /* //comment out this section to move to 24 hour time	
    var ap = hrs >= 12 ? ' pm' : ' am';
    if (hrs == 24) ap = ' am';

    hrs = hrs % 12;

    if (hrs === 0) hrs = 12;
    return hrs + ":" + mins + ap;*/
    return hrs + ":" + mins;	//new line to remove AM/PM suffix			
  },

  /** get a name for a routedirection */
  getname: function (rd) {
    var name = rd.route.route_short_name !== null ?
    rd.route.route_short_name :
    rd.route.route_long_name;
    return name + " -- " + rd.destination;    //I'm reducing the number of times 'to' is used to minimize confusion between
                                              //identifying the direction of travel and the destination name of a route. 
  },

  redraw: function () {
    var instance = this;

    // clear the plot
    d3.select("svg").remove();

    if (!this.data)
      // still starting up
      return;

    if (this.data.length === 0) {
      d3.select("#title").text('No transfers from this route and direction');
      return;
    }
    
    // Display the attributes of the From-Route as inbound or outbound rather than towards a particular stop. 
    if (this.direction === 0) {		
	  var ibob = "Outbound";			
	  }								
	  if (this.direction === 1) {		
	  var ibob = "Inbound";			
	  }
    
    // set the title
    d3.select("#title").text("Transfers from #" + this.route + " - " + ibob + " to...");  //simplifies how data is displayed. 	//$tim66

    // draw the new plot
    // figure the spacing
    // we use data.length not data.length - 1 so that we have room for everything
    var yscale = d3.scale.linear()
      .range([0, this.height - 55])
      .domain([0, this.data.length]);

    // 250 is for text
    var xscale = d3.scale.linear()
      .domain([-5, 85])				//default [0, 90] - this scales the entire chart, not just the circles
      .range([400, this.width - 10]);  //note - unrelated to threshold distance

    var svg = d3.select(".figure")
      .append('svg')
      .style("width", this.width + 'px')
      .style("height", this.height + 'px')
      .append('g');

    // append each transfer
    var transfers = svg.selectAll('g.transfer2')	
      .data(this.data);
	  
	var transfers3 = svg.selectAll('g.transfer3')		//$tim33
      .data(this.data);									//$tim33  

    transfers		//$tim this is the actual transfer svg plot ##########################
      .enter()
      .append('g')
      .attr('class', 'transfer2')	
      .attr('transform', function (d, i) {
        return 'translate(0 ' + yscale(i + 1) + ')';
      });

	transfers3											//$tim33
      .enter()											//$tim33
      .append('g')										//$tim33
      .attr('class', 'transfer3')						//$tim33
      .attr('transform', function (d4, i) {				//$tim33
        return 'translate(0 ' + yscale(i + 1) + ')';	//$tim33
      });												//$tim33
	  
    transfers
      .append('text')
      .text(function (d) {
        if (d.toRouteDirection.direction === "DIR_0") {	
	      var ibob2 = "Outbound";							
	      }													
	    if (d.toRouteDirection.direction === "DIR_1") {	
	      var ibob2 = "Inbound";							
	      }	
        return  d.toRouteDirection.route.route_short_name + " - " + ibob2 + " (" + d.fromStop.stop_name + ")";  //$tim simplifies how data is displayed
		
      })
      .append('title')
      .text(function (d) {
		var vDist = d.distance * 0.000621371 * 100; //$tim new variable for transfer distance, converted from meters to miles
		var vDist = Math.round(vDist);				//$tim math to get decimal precision correct. 
		var vDist = vDist / 100; 					//$tim math to get decimal precision correct. 
		return "deboard:\t\t" + d.fromStop.stop_name + " (" + d.fromStop.stop_id + ") \nboard:\t\t" + d.toStop.stop_name + " (" + d.toStop.stop_id + ")\ndistance:\t\t" + vDist + " miles";  //$tim re-wrote to give more info regarding off, on stops & distance between. 
      });

    var offset = -transfers[0][0].getBBox().height / 3;

    // add a line from each transfer so you can follow it across
    transfers.append('line')
      .attr('x1', xscale(-5))	//default 0
      .attr('x2', xscale(85))	//default 90, this is the horizontal line
      .attr('y1', offset)
      .attr('y2', offset)
      .attr('class', 'transfer-line');

    // hierarchical binding: see http://bost.ocks.org/mike/nest/
    var transferMarkers = transfers.selectAll('circle')
      .data(function (d, i) {
        // TODO: filter here
        var filtered = [];

        d.transferTimes.forEach(function (tt) {
          if (tt.timeOfDay >= instance.range[0] * 3600 && tt.timeOfDay <= instance.range[1] * 3600) {
            filtered.push(tt);
          }
        });

        return filtered;
      });

    var transferMarkers3 = transfers3.selectAll('circle')												//$tim33
      .data(function (d4, i) {																			//$tim33
        // TODO: filter here																			//$tim33
        var filtered = [];																				//$tim33
																										//$tim33
        d4.transferTimes.forEach(function (tt3) {														//$tim33
          if (tt3.timeOfDay >= instance.range[0] * 3600 && tt3.timeOfDay <= instance.range[1] * 3600) {	//$tim33
            filtered.push(tt3);																			//$tim33
          }																								//$tim33
        });																								//$tim33
																										//$tim33
        return filtered;																				//$tim33
      });																								//$tim33

	  
    transferMarkers.enter()
      .append('circle')
      .attr('class', 'transfer-marker')
      .attr('r', '3');		//$tim - control radius of the circle marker.

    transferMarkers
	  .attr('cy', offset)
      .attr('cx', function (d) {
	if (d.lengthOfTransfer / 60 <= 2 && d.lengthOfTransfer / 60 >= -10) {	//$tim-z	  
        return xscale(d.lengthOfTransfer / 60);								//$tim-z			
      }	else {	  															//$tim-z		
	    return xscale(-100);  												//$tim-z		
		}  																	//$tim-z		
      })
      .append('title')
	  .text(function (d) {
	  //if (Math.round(d.lengthOfTransfer / 60) > -3) {													//$tim33x - this is groundbreaking
        return 'Missed a transfer ' + Math.round(d.lengthOfTransfer / 60) + ' minutes prior at ' + instance.formatTime(d.timeOfDay / 3600);
	//}																									//$tim33x - this is groundbreaking
      });

	transferMarkers3.enter()																							//$tim33
      .append('circle')																									//$tim33
      .attr('class', 'transfer-marker')	//$tim33																		//$tim33
      .attr('r', '3');																									//$tim33
																													
    transferMarkers3																									//$tim33
	  .attr('cy', offset)																								//$tim33
      .attr('cx', function (d4) {																						//$tim33
	if (d4.lengthOfTransfer / 60 > 2 && d4.lengthOfTransfer / 60 != null) {	//$tim-z
  	  return xscale(d4.lengthOfTransfer / 60);																			//$tim33
      }	else {																											//$tim-z
	    return xscale(-100);
	  }

	  })																												//$tim33

	  .append('title')																									//$tim33
      .text(function (d4) {																								//$tim33
        return Math.round(d4.lengthOfTransfer / 60) + ' minute transfer at ' + instance.formatTime(d4.timeOfDay / 3600);//$tim33x - this is the plot label
      });																												//$tim33
	  
      // set up the axis
      var axis = d3.svg.axis()
        .scale(xscale)
        .orient('bottom');

      svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(0 ' + (this.height - 45) + ')')
        .call(axis);

      // add the label
      svg.append('g')
        .attr('class', 'label')
        .attr('transform', 'translate(' + (this.width / 2) + ' ' + (this.height - 4) + ')')
        .append('text')
        .text('Transfer length (minutes)');
  }
 
};
