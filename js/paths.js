var pathToPoints = (function () {
  // Path parsing logic borrowed from https://raw.github.com/DmitryBaranovskiy/raphael (MIT)
  var pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
      pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,
      p2s = /,?([achlmqrstvxz]),?/gi;
  function parsePathString (pathString) {
    var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
        data = [];
    String(pathString).replace(pathCommand, function (a, b, c) {
        var params = [],
            name = b.toLowerCase();
        c.replace(pathValues, function (a, b) {
            b && params.push(+b);
        });
        if (name == "m" && params.length > 2) {
            data.push([b].concat(params.splice(0, 2)));
            name = "l";
            b = b == "m" ? "l" : "L";
        }
        if (name == "r") {
            data.push([b].concat(params));
        } else while (params.length >= paramCounts[name]) {
            data.push([b].concat(params.splice(0, paramCounts[name])));
            if (!paramCounts[name]) {
                break;
            }
        }
    });
    return data;
  }

    //Calculate point along a cubic bezier where t is between 0 and 1
  function bezierPoint (start, control_1, control_2, end, t) {
    var point = [0, 0];

    //Calculate weights for point influence
    var w0 = Math.pow((1-t), 3);
    var w1 = 3*t*Math.pow((1-t), 2);
    var w2 = 3*Math.pow(t, 2)*(1-t);
    var w3 = Math.pow(t, 3);

    point[0] = w0*start[0] + w1*control_1[0] + w2*control_2[0] + w3*end[0];
    point[1] = w0*start[1] + w1*control_1[1] + w2*control_2[1] + w3*end[1];

    return point;
  }

  // Translate potentially relative path commands into absolute ones
  function absolutizePathData (data) {
    var accum = [],
        // The first command must be a moveto
        last = data[0],
        c;
    accum.push(data[0]);
    var last_control_2 = null;
    for (var i = 1; i < data.length; ++i) {
      c = data[i];
      if (c[0] == "z") {
        continue;
      }
      if (c[0] == "m" || c[0] == "l") {
        c = [
          c[0].toUpperCase(),
          last[1] + c[1],
          last[2] + c[2]
        ];
      }
      if (c[0] == "h") {
        c = [
          "L",
          last[1] + c[1],
          last[2]
        ];
      }
      if (c[0] == "v") {
        c = [
          "L",
          last[1],
          last[2] + c[1]
        ];
      }
      if (c[0] == "V") {
        c = [
          "L",
          last[1],
          c[1]
        ];
      }
      if (c[0] == "H") {
        c = [
          "L",
          c[1],
          last[2]
        ];
      }
      //Handle curves
      if (c[0] === "c" || c[0] === "C" || c[0] === "s" || c[0] === "S") {
        var start, control_1, control_2, end;
        if (c[0] === "c" || c[0] === "C") {
          start = [last[1], last[2]];
          control_1 = [last[1] + c[1], last[2] + c[2]];
          control_2 = [last[1] + c[3], last[2] + c[4]];
          end = [last[1] + c[5], last[2] + c[6]];

          if (c[0] === "C") {
            control_1 = [c[1], c[2]];
            control_2 = [c[3], c[4]];
            end = [c[5], c[6]];
          }
        } else {
          start = [last[1], last[2]];
          control_2 = [last[1] + c[1], last[2] + c[2]];
          end = [last[1] + c[3], last[2] + c[4]];

          if (c[0] === "S") {
            control_2 = [c[1], c[2]];
            end = [c[3], c[4]];
          }
          control_1 = [2 * start[0] - last_control_2[0], 2 * start[1] - last_control_2[1]];
        }

        last_control_2 = control_2;

        var subs = 20;
        for (var j = 0; j < subs; j++) {
          var t = j/subs;
          var point = bezierPoint(start, control_1, control_2, end, t);
          var new_c = [
            "L",
            point[0],
            point[1]
          ];
          accum.push(new_c);
          last = new_c;
        }
        c = [
          "L",
          end[0],
          end[1]
        ];
      }

      accum.push(c);
      last = c;
    }
    return accum;
  }

  // Currently unused, but maybe useful in the future (and I don't want to dive
  // back into raphael to figure it out)
  function pathToString (data) {
    return data.join(",").replace(p2s, "$1");
  }

  // TODO: doesn't handle paths with curves
  function pathToPoints (data) {
    var polys = [],
        p = [],
        c;
    for (var i = 0; i < data.length; ++i) {
      c = data[i];
      if (c[0] == "M") {
        polys.push(p);
        p = [];
      }
      else if (c[0] == "S") {
        return [];
      }
      p.push([c[2], c[1]]);
    }
    polys.push(p);
    return polys;
  }

  return function (pathString) {
    return pathToPoints(absolutizePathData(parsePathString(pathString)));
  };
})();