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

var positionBin = function(pos){
    var bin;
    switch (pos) {
        case "ST":
        case "CF":
        case "LF":
        case "RF":
            bin = "Striker";
            break;
        case "CM":
        case "CDM":
        case "CAM":
            bin = "Central Midfield";
            break;
        case "LW":
        case "RW":
        case "LM":
        case "RM":
            bin = "Winger";
            break;
        case "CB":
        case "LB":
        case "RB":
        case "LWB":
        case "RWB":
            bin = "Defender";
            break;
        case "GK":
            bin = "Goalkeeper";
            break;
        default:
            bin = "Unknown";
    }
    return bin;
};