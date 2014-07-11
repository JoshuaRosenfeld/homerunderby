$(document).ready(function() {

	var map;
	var overlay = {};
	var visible = {
		'Jose Bautista': true,
		'Yoenis Cespedes': true,
		'Adam Jones': true,
		'Brian Dozier': true,
		'Josh Donaldson': true,
		'Troy Tulowitzki': true,
		'Todd Frazier': true,
		'Yasiel Puig': true,
		'Justin Morneau': true,
		'Giancarlo Stanton': true
	}

	var colors = {
		'Jose Bautista': [149, 216, 255, 0.3],
		'Yoenis Cespedes': [0, 75, 58, 0.3],
		'Adam Jones': [246, 127, 43, 0.3],
		'Brian Dozier': [212, 31, 70, 0.3],
		'Josh Donaldson': [143, 202, 0, 0.3],
		'Troy Tulowitzki': [77, 56, 123, 0.3],
		'Todd Frazier': [255, 0, 0, 0.3],
		'Yasiel Puig': [0, 85, 151, 0.3],
		'Justin Morneau': [120, 120, 120, 0.3],
		'Giancarlo Stanton': [255, 202, 0, 0.3]
	}

	var color_gradient = {
		1: '#099009',
		2: '#129309',
		3: '#1D9609',
		4: '#27990A',
		5: '#329B0A',
		6: '#3E9F0B',
		7: '#49A20B',
		8: '#55A50B',
		9: '#62A80C',
		10: '#6FAB0C',
		11: '#7CAE0D',
		12: '#89B10D',
		13: '#97B40E',
		14: '#A5B70E',
		15: '#B4BA0F',
		16: '#BDB70F',
		17: '#C0AD10',
		18: '#C3A410',
		19: '#C69A11',
		20: '#C99012',
		21: '#CC8512',
		22: '#CF7A13',
		23: '#D26F13',
		24: '#D56414',
		25: '#D85814',
		26: '#DB4B15',
		27: '#DE3F16',
		28: '#E13216',
		29: '#E42517',
		30: '#E71818'
	}

	$('.player-container').slick({
		dots: true,
		slidesToShow: 1,
		speed: 500,
		fade: true,
		cssEase: 'linear'
	});

	populateTable();

	$('.table').tablesorter();

	map = initializeMap(map);
	map = addMarkers(map);
	map = fillSections(map);

	function initializeMap(map) {

		L.CRS.SeatGeek = L.extend({}, L.CRS.Simple, {
			transformation: new L.Transformation(0.35, 0, 0.35, 0)
		});


		map = L.map('map', {
			crs: L.CRS.SeatGeek,
			center: [500, 500],
			zoom: 1,
			scrollWheelZoom: false,
			touchZoom: false
		});
	 
		L.tileLayer('http://{s}.tiles.seatgeek.com/v3/maps/{mapId}/{z}/{x}/{y}.png', {
			mapId: 'v3712-2654-2',
			tileSize: 350,
			minZoom: 1,
			maxZoom: 4,
			noWrap: true
		}).addTo(map);

		$('.restore').click(function() {
			map.setView([500, 500], 1);
			_.each(visible, function(value, key) {
				visible[key] = true;
				map.addLayer(overlay[key]);
				var circles =  $('div.circle');
				for (var i = 0; i < 9; i++) {
					var c = circles[i];
					var name = $(c).data('name');
					var color = colors[name];
					$(c).css('background-color', 'rgba('+color+')');
				}
			});
		});

		$('.circle').click(function() {
			var name = $(this).data('name');
			if (visible[name]) {
				map.removeLayer(overlay[name]);
				$(this).css('background-color', 'rgb(255, 255, 255)');
			} else {
				map.addLayer(overlay[name]);
				color = colors[name];
				$(this).css('background-color', 'rgba('+color+')');
			}
			visible[name] = !visible[name];
		});

		return map;
	}

	function addMarkers(map) {

		var icon_dict = {
			iconSize:     [15, 15],
			iconAnchor:   [7.5, 7.5],
			popupAnchor:  [0, 0]
		};

		_.each(players, function(player, player_index) {
			var markers = [];
			var player_icon_dict = _.extend(icon_dict, {iconUrl: player['icon']});

			var player_icon = L.icon(player_icon_dict);

			_.each(player['homeruns'], function(homerun, homerun_index) {
				var marker = L.marker([homerun[0], homerun[1]], {icon: player_icon}).bindPopup(player['name']);
				markers.push(marker);
			})

			var layer = L.layerGroup(markers).addTo(map);

			overlay[player['name']] = layer;
		});

		return map;
	}

	function fillSections(map) {

		$.ajax({
			dataType: "json",
			url: "http://tiles.seatgeek.com/v3/maps/v3712-2654-2.json",
			cache: true,
			success: function (map_data) {
				render(map_data);
				return map;
			}
		});

		var opts = {
		    weight: 0,
		    fillOpacity: 0.65,
		    clickable: false
		};

		function render(map_data) {
			_.each(sections, function(element, index, list) {

				var section = map_data.sections[element['name']];

				if (section) {
					var path_string = section.path;
					path = pathToPoints(path_string);

					var cost = element['avg_price'] / element['homeruns'];
					var color = '#ffffff'
					if(element['rank']) {
						color = color_gradient[element['rank']];
					}

					var polyopts = _.extend({ fillColor: color }, opts);
					L.polygon(path, polyopts).addTo(map);
				}
			});
		}
	}

	function populateTable() {
		_.each(sections, function(element, index, list) {

			var name = element['name'];

			if (name == "great-clips-great-seats") {
				name = "GCGS";
			}

			var avg = element['avg_price'];
			var hr = element['homeruns'];
			var cost;

			cost = '$' + (avg / element['homeruns']).toFixed(2);
			avg = '$' + Math.round(avg);

			if (hr == 0) {
				cost = "n/a"
			}

			$( "<tr><td>" + name + "</td><td>" + avg + "</td><td>" + element['homeruns'] +
				"</td><td>" + cost + "</td></tr>" ).appendTo( '.table > tbody' );
		});
	}

});