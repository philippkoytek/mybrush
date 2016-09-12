class Lines {

    /**
     * creates a line from s to e with the specified curveStyle. For better animation results it makes sure 
     * that the line has the same amount of points as the previous one that is stored in pathNode's _curve property.
     * Side effect: updates pathNode's _curve property to the new line points (as array)
     * @param s {{x,y}} start point of line
     * @param e {{x,y}} end point of line
     * @param curveStyle {string} the interpolation style of the curve
     * @param pathNode {object} the dom node that stores the current line points in its property _curve for animation reasons
     * @returns {string} the line's string representation for the d-attribute of a path node
     */
    static makeLine(s, e, curveStyle, pathNode){
        var points;
        var res = 5;
        var type = 'bspline';
        if(curveStyle == 'linear'){
            points = [s, e];
            res = 0;
        }
        else {
            points = [s, {x:(s.x + e.x)/2, y:s.y}, {x:(s.x + e.x)/2, y:e.y}, e];
        }

        if(curveStyle == 'step'){
            curveStyle = 'linear';
            res = 0;
        }

        if(curveStyle == 'cardinal'){
            type = 'catmull-rom';
        }

        var newCurve = new SDCurve({
            points: points,
            degree: 2,
            resolution:res,
            type:type
        }).curve().map(function(d){
            return d.point;
        });

        if(pathNode._curve && curveStyle){
            if(pathNode._curve.length > newCurve.length){
                Lines.insertPoints(newCurve, pathNode._curve.length - newCurve.length);
            }
            else if (newCurve.length > pathNode._curve.length) {
                Lines.insertPoints(pathNode._curve, newCurve.length - pathNode._curve.length);
                d3.select(pathNode).attr('d', function(){
                    return Lines.drawCurve(pathNode._curve);
                });
            }
        }

        //todo: performance improvement possible here by caching the curves for different line styles in a property of pathNode
        pathNode._curve = newCurve;
        return Lines.drawCurve(pathNode._curve);
    }

    static drawCurve(curve){
        return d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear")(curve);
    }

    /**
     * inserts <count> points to the array <curvePoints> and distributes them evenly across all line segments.
     * Manipulates the given array <curvePoints> by inserting points
     * @param curvePoints {[]} the curve's array of points. (the number of line segments can be determined by: curvePoints.length-1)
     * @param count {int} total number of points to be added to the curve
     */
    static insertPoints(curvePoints, count){
        var pointsPerSegment = count / (curvePoints.length-1);  // number of points that need to be added on each line segment (in average)
        var totalPointsAdded = 0;
        var pointsForSegmentI;
        // iterate over all line segments of the curve (eg. segment1 is from point 0 to point 1)
        for(var segmentI = 1; segmentI <= curvePoints.length-1-totalPointsAdded; segmentI++){
            pointsForSegmentI = Math.round(segmentI * pointsPerSegment) - totalPointsAdded;  // determined by calculating the points to be added from segment0 to segmentI minus the points already added
            if(pointsForSegmentI > 0){
                curvePoints.splice(segmentI+totalPointsAdded, 0, ...Lines.distributePointsBetween(curvePoints[segmentI+totalPointsAdded - 1], curvePoints[segmentI+totalPointsAdded], pointsForSegmentI));
                totalPointsAdded += pointsForSegmentI;
            }
        }
    }

    /**
     * calculates evenly distributed points that are on a straight line between points a and b
     * format of points: {x:.., y:..}
     * @param a {object} start point of line
     * @param b {object} end point of line
     * @param n {int} number of points to insert between a and b
     * @return {[]} array of n evenly distributed points on the line between a and b
     */
    static distributePointsBetween(a, b, n) {
        var dx = (b.x - a.x) / (n + 1);
        var dy = (b.y - a.y) / (n + 1);
        var points = [];
        for(var i = 1; i <= n; i++){
            points.push({
                x: a.x + dx*i,
                y: a.y + dy*i
            });
        }
        return points;
    }
}