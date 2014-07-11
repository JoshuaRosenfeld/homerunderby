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
				map.addLayer(overlay[name]);
			});
		});

		$('.outer-circle').click(function() {
			var name = $(this).data('name');
			if (visible[name]) {
				map.removeLayer(overlay[name]);
			} else {
				map.addLayer(overlay[name]);
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
				var marker = L.marker([homerun[0], homerun[1]], {icon: player_icon}).bindPopup(homerun[0] + " " + homerun[1]);
				markers.push(marker);
			})

			var layer = L.layerGroup(markers).addTo(map);


			overlay[player['name']] = layer;
		});

		// for (var i = 0; i += 100; i <= 1000) {
		// 	var points = [[i, 0], [i, 1000]];
		// 	var line = new L.Polyline(points, {
		// 		color: 'red',
		// 		weight: 3,
		// 		opacity: 0.5,
		// 		smoothFactor: 1
		// 	}).addTo(map);

		// 	var points2 = [[0, i], [1000, i]];
		// 	var line = new L.Polyline(points, {
		// 		color: 'blue',
		// 		weight: 3,
		// 		opacity: 0.5,
		// 		smoothFactor: 1
		// 	}).addTo(map);
		// }

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
		    fillOpacity: 0.4,
		    clickable: false
		};

		function render(map_data) {
			_.each(sections, function(element, index, list) {

				var section = map_data.sections[element['name']];

				if (section) {
					var path_string = section.path;
					path = pathToPoints(path_string);

					var cost = element['avg_price'] / element['homeruns'];

					var yellow = '#ffff00';
					var green = '#00ff00';
					var red = '#ff0000';

					var color = yellow;

					var polyopts = _.extend({ fillColor: color }, opts);
					L.polygon(path, polyopts).addTo(map);
				}
			});
		}
	}

	function populateTable() {
		_.each(sections, function(element, index, list) {

			var name = element['name'];

			if (element['name'] == "great-clips-great-seats") {
				name = "GCGS";
			}

			var cost = element['avg_price'] / element['homeruns'];
			$( "<tr><td>" + name + "</td><td>$" + 
				element['avg_price'] + "</td><td>" + element['homeruns'] +
				"</td><td>$" + cost + "</td></tr>" ).appendTo( '.table > tbody' );
		});
	}

});