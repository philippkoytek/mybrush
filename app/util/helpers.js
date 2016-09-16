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

//TODO: remove this from here eventually
var positions = {
    offensive:['LW', 'ST', 'RW', 'CF', 'LF', 'RF'],
    midfield:['CAM', 'LM', 'RM', 'CM', 'CDM'],
    defensive:['LWB', 'RWB', 'LB', 'RB', 'CB'],
    goalkeeper:['GK']
};