
/***
 * Benchmarking two different variants of function distributePointsBetween(a,b,n) 
 ***/
/**
 * calculates evenly distributed points that are on a straight line between points a and b
 * format of points: {x:.., y:..}
 * @param a {object} start point of line
 * @param b {object} end point of line
 * @param n {int} number of points to insert between a and b
 * @return {[]} array of n evenly distributed points on the line between a and b
 */




function d1(a, b, n) {
    var points = [];
    for(var i = 1; i <= n; i++){
        points.push({point:{
            x: (a.x*(n+1-i) + b.x*i) / (n+1), // leaving out the brackets around n+1 produces some crazy spikes on the curves ;)
            y: (a.y*(n+1-i) + b.y*i) / (n+1)
        }});
    }
    return points;
}

function d2(a, b, n){
    var dx = (b.x - a.x) / (n + 1);
    var dy = (b.y - a.y) / (n + 1);
    var points = [];
    for(var i = 1; i <= n; i++){
        points.push({point:{
            x: a.x + dx*i,
            y: a.y + dy*i
        }});
    }
    return points;
}

function benchmark(n, runs){

    var a = {x:Math.random()*1000, y:Math.random()*1000};
    var b = {x:Math.random()*1000, y:Math.random()*1000};
    var results1 = [];
    var results2 = [];



    console.log('TEST d1');
    var before1 = performance.now();
    for(var i1 = 0; i1 < runs; i1++){
        d1(a,b,n);
    }
    results1.push(performance.now() - before1);

    console.log('TEST d2');
    var before2 = performance.now();
    for(var i2 = 0; i2 < runs; i2++){
        d2(a,b,n);
    }
    results2.push(performance.now() - before2);




    console.log('RESULTS d1:');
    console.log('average:' + _.reduce(results1, sum, 0)/results1.length);
    console.log('max:' + _.reduce(results1, max));
    console.log('min:' + _.reduce(results1, max));


    console.log('RESULTS d2:');
    console.log('average:' + _.reduce(results2, sum, 0)/results2.length);
    console.log('max:' + _.reduce(results2, max));
    console.log('min:' + _.reduce(results2, min));
}

function sum(sum, n){
    return sum + n;
}

function max(max, n){
    return (n > max)?n:max;
}

function min(min, n){
    return (n < min)?n:min;
}