/**
 * D3 Extensions
 */

// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

function makeAbsoluteContext(element, svgDocument) {
    return function(x,y) {
        var offset = svgDocument.getBoundingClientRect();
        var matrix = element.getScreenCTM();
        return {
            x: (matrix.a * x) + (matrix.c * y) + matrix.e - offset.left,
            y: (matrix.b * x) + (matrix.d * y) + matrix.f - offset.top
        };
    };
}

function arrayOfNumbers (from, to) {
    var arr = [];
    for(var i = from; i <= to; i++){
        arr.push(i);
    }
    return arr;
}

//TODO: remove this from here eventually
var positions = {
    offensive:['LW', 'ST', 'RW', 'CF', 'LF', 'RF'],
    midfield:['CAM', 'LM', 'RM', 'CM', 'CDM'],
    defensive:['LWB', 'RWB', 'LB', 'RB', 'CB'],
    goalkeeper:['GK']
};

var morePositions = {
    goalkeeper:['GK'],
    centerDefense:['CB'],
    wingDefense:['LWB', 'RWB', 'LB', 'RB'],
    centerMidfield:['CAM', 'CM', 'CDM'],
    wingMidfield:['LM', 'RM', 'LW', 'RW'],
    forward:[]
}