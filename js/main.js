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