var TestResultOptions = function(options) {
    var newopts = {
        "result": options.result,
        "units": options.units,
        "ticks": options.ticks,
        "colors": options.colors,
        "standard": options.standard,
        "labels": options.labels || [],
        "decimals": options.decimals || 1,
        "gradient": options.gradient || false,
        "endCaps": options.endCaps || ["transparent", "transparent"],
        "height": options.height || 100,
        "width": options.width || 900
    };

    return newopts;
}



var TestResultSpec = function(options) {

    var testResultObj = {
        "name":"testResult",
        "values": [{
        "result":options.result,
        "units": options.units
    }]
    }

    var buildRanges = function(){
        var std = "non";
        if (options.standard[0] == options.ticks[0] & options.standard[1] == options.ticks[1]){
            std = "std"
        }
        // initial range
        var rangesVals = [
            {"start":options.ticks[0], "end":options.ticks[1], "fill": options.colors[0],"standard":std, "label":options.labels[0]}
        ];

        for (i = 2; i < options.ticks.length; i++){
            std = "non";
            if (options.ticks[i-1]==options.standard[0] & options.ticks[i]==options.standard[1]){
                std = "std";
            }
            var newRange = {
                "start": options.ticks[i-1],
                "end": options.ticks[i],
                "fill":options.colors[i-1],
                "standard": std,
                "label":options.labels[i-1]
            }
            rangesVals.push(newRange);
        }
        var rangesObj = {
            "name":"ranges",
            "values": rangesVals
        };

        return rangesObj;
    }

    var buildTickObj = function (){
        var tickVals = [];
        for (i = 0; i < options.ticks.length; i++) {
            var u = {}
            u.point = options.ticks[i];
            u.label = options.ticks[i].toFixed(options.decimals);

            var color = "white";
            if (options.gradient) {
                if (0 < i < options.ticks.length) {
                    color = "transparent"
                }
            }
            u.color = color;
            tickVals.push(u);
        }
        var tickObj = {
            "name": "ticks",
            "values": tickVals
        };
        return tickObj;
    }

    var buildEndCaps = function() {
        var endCapsObj = {
            "name":"endCaps",
            "values":[
                {"pointing":"triangle-left", "fill":options.endCaps[0], "x":options.ticks[0]},
                {"pointing":"triangle-right", "fill":options.endCaps[1], "x":options.ticks[options.ticks.length-1]},
            ]
        };

        return endCapsObj;

    }

    var buildEndPointsObj = function() {
        var endPointsObj = {
            "name": "endPoints",
            "values": [
                {"start": options.ticks[0],
                "end": options.ticks[ticks.length-1]
                }
            ]
        };
        return endPointsObj;
    }

    var scalePoint = function(point) {
        var min = options.ticks[0];
        var max = options.ticks[options.ticks.length-1];
        return (point-min) / (max-min);
    }

    var setOffset = function(rngStart, rngEnd, type, stdRelation) {
        var offset;
        if (type=="start") {
            if (stdRelation == "after") {
                offset = scalePoint(rngStart) + .4*(scalePoint(rngEnd)-scalePoint(rngStart));
            } else {
                offset = scalePoint(rngStart);
            }
        } else {
            if (stdRelation=="before"){
                offset = scalePoint(rngStart) + .6*(scalePoint(rngEnd)-scalePoint(rngStart));
            } else {
                offset = scalePoint(rngEnd);
            }
        }

        return offset;
    };

    var buildGradient = function() {

        var stops = [];

        var stdRelation = "before"; // a marker to indicate whether the loop has reached the standard range, is currently in the standard range, or has passed it
        for (var i=0; i < rangesObj.values.length; i++) {


            var stdRelation = (rangesObj.values[i].standard == "std") ? "std" : stdRelation;

            var beg = {
                "color":rangesObj.values[i].fill,
                "offset":setOffset(rangesObj.values[i].start, rangesObj.values[i].end, "start", stdRelation)
            };

            stops.push(beg);


            var end = {
                "color":rangesObj.values[i].fill,
                "offset" : setOffset(rangesObj.values[i].start, rangesObj.values[i].end, "end", stdRelation)
            };

            stops.push(end);
            stdRelation = (rangesObj.values[i].standard == "std") ? "after" : stdRelation;
        }

        var gradObj = {
            "value":{
                "id":"grad",
                "x1":0.0,
                "x2":1.0,
                "y1":0.0,
                "y2":0.0,
                "stops": stops
            }
        };

        return gradObj;



    }

    var buildBaselineRect = function() {

        var src = options.gradient ? "endPoints" : "ranges";
        var fillObj = options.gradient ? buildGradient(rangesObj) : {"field":"fill"};
        var temp = {
            "type":"rect",
            "from":{"data":src},
            "encode": {
                "enter": {
                    "x":{"scale":"ranges", "field":"start"},
                    "x2":{"scale":"ranges", "field":"end"},
                    "y":{"signal":"height/2"},
                    "height":{"signal":"blockHeight"},
                    "fill" : fillObj
                }
            }
        };

        return temp;
    }

    var rangesObj = buildRanges();
    var tickObj = buildTickObj();
    var endCapsObj = buildEndCaps();
    var rectObj = buildBaselineRect();
    var rangeWidth = options.width - 26;

    var buildSpec = function(){
        var endPointsObj = {
            "name": "endPoints",
            "source": "ranges",
            "transform":[
                {"type": "aggregate",
                "fields":["start","end"],
                "ops":["min","max"],
                "as":["start", "end"]
                }
            ]
        };

        var data = [testResultObj,rangesObj, tickObj, endCapsObj, endPointsObj];

        var spec = {
            "$schema": "https://vega.github.io/schema/vega/v3.0.json",
            "width": 908,
            "height": 100,
            "signals" : [
                {"name": "blockHeight", "value":30},
                {"name":"tickGap", "value": 2}
            ],

            "data": data,
            "scales": [
                {
                    "name": "ranges",
                    "type": "linear",
                    "domain":[options.ticks[0],options.ticks[options.ticks.length-1]],
                    "range":[0,rangeWidth],
                    "zero":false
                }
            ],

            "marks": [
                {
                    "type":"symbol",
                    "from":{"data":"endCaps"},
                    "encode": {
                        "enter": {
                            "x":{"signal":"datum.pointing=='triangle-right' ? scale('ranges',datum.x)+26 : scale('ranges', datum.x)"},
                            "shape": {"field":"pointing"},
                            "size":{"value":900},
                            "fill":{"field":"fill"},
                            "yc": {"signal":"(height/2)+(blockHeight/2)"},
                            "stroke":{"field":"stroke"}
                        }
                    }
                },
                {
                    "type":"group",
                    "encode": {
                        "enter": {
                            "x":{"value":13}
                        }
                    },
                    "marks":[
                        rectObj,
                        {
                            "type": "rect",
                            "from": {"data":"testResult"},
                            "encode": {
                                "enter":{
                                    "xc" : {"scale":"ranges", "field":"result"},
                                    "width": {"value":10},
                                    "fill":{"value":"white"},
                                    "yc":{"signal":"height/2 + blockHeight/2"},
                                    "height": {"signal":"blockHeight + (2*tickGap)"},
                                    "stroke":{"value":"black"},
                                    "strokeWidth":{"value":4},
                                    "cornerRadius":{"value":3}
                                }
                            }
                        },
                        {
                            "type":"group",
                            "from":{"data":"testResult"},
                            "encode":{
                                "enter":{
                                    "fill":{"value":"white"},
                                    "stroke":{"value":"black"},
                                    "strokeWidth":{"value":2},
                                    "xc":{"scale":"ranges", "field":"result"},
                                    "width":{"signal":"2*blockHeight"},
                                    "height":{"signal":"blockHeight"},
                                    "cornerRadius":{"value":3},
                                    "clip":{"value":false}
                                }
                            },
                            "marks": [
                                {
                                    "type":"rule",
                                    "encode":{
                                        "enter":{
                                            "x":{"value":23},
                                            "x2": {"value":37},
                                            "y":{"value":30.5},
                                            "y2":{"value":30.5},
                                            "stroke":{"value":"white"},
                                            "strokeWidth":{"value":3}
                                        }
                                    }
                                },
                                {
                                    "type":"path",
                                    "encode": {
                                        "enter": {
                                            "path": {
                                                "value": "M0,0 L4,0 L10,8 L16,0 L20,0"
                                            },
                                            "stroke": {"value":"black"},
                                            "strokeWidth": {"value":2},
                                            "x":{"value":20},
                                            "y":{"value":30.5}
                                        }
                                    }
                                },
                                {
                                    "type":"text",
                                    "from":{"data":"testResult"},
                                    "encode": {
                                        "enter": {
                                            "fill": {"value": "black"},
                                            "fontSize":{"value":14},
                                            "fontWeight": {"value":"bold"},
                                            "text":{"signal":"datum.result + ' ' + datum.units"},
                                            "align":{"value":"center"},
                                            "baseline":{"value":"alphabetic"},
                                            "dx":{"value":30.5},
                                            "dy":{"value":20}
                                        }
                                    }
                                },
                                {
                                    "type":"text",
                                    "encode":{
                                        "enter": {
                                            "fill":{"value":"black"},
                                            "text":{"value":"Your Result"},
                                            "dy":{"value":-5},
                                            "align":{"value":"center"},
                                            "dx":{"value":"30.5"}
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            "type":"group",
                            "marks":[
                                {
                                    "type":"text",
                                    "from":{"data":"ticks"},
                                    "encode":{
                                        "enter":{
                                            "fill":{"value":"black"},
                                            "x":{"scale":"ranges", "field":"point"},
                                            "y":{"signal":"height/2-tickGap"},
                                            "text":{"field":"label"},
                                            "align":{"value":"center"}
                                        }
                                    }
                                },
                                {
                                    "type":"rule",
                                    "from":{"data":"ticks"},
                                    "encode":{
                                      "enter":{
                                        "stroke": {"field":"color"},
                                        "strokeWidth":{"value":2},
                                        "x":{"scale":"ranges", "field":"point"},
                                        "x2":{"scale":"ranges", "field":"point"},
                                        "y":{"signal":"height/2"},
                                        "y2":{"signal":"height/2 + blockHeight"}
                                      }
                                    }
                                },
                                {
                                    "type":"text",
                                    "from":{"data":"ranges"},
                                    "encode":{
                                        "enter":{
                                            "x":{"signal": "(scale('ranges', datum.end)-scale('ranges', datum.start))/2 + scale('ranges', datum.start)"},
                                            "text":{"field":"label"},
                                            "y": {"signal":"(height/2) + blockHeight + 15"},
                                            "align":{"value":"center"},
                                            "fontWeight":{"signal": "datum.label == 'Standard Range' ? 'bold' : 'normal'"}
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        return spec;
    }

    return {
        buildSpec: buildSpec,
    }
}
