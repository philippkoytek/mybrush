/**
 * Created by Philipp Koytek on 6/9/2016.
 */

class View {
    constructor (svgElement, width, height, position, padding) {
        padding = padding || {top:20, right:20, bottom:30, left:40};
        this.frameWidth = width || 960;
        this.frameHeight = height || 500;
        this.chartHeight = this.frameHeight - padding.top - padding.bottom;
        this.chartWidth = this.frameWidth - padding.left - padding.right;
        this.position = position || {x:0, y:0};

        this.svg = d3.select(svgElement)
            .attr('class', 'view')
            .attr('transform', 'translate(' + this.position.x + ',' + this.position.y + ')');

        this.svg.append('rect')
            .attr('class', 'frame')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.frameWidth)
            .attr('height', this.frameHeight);

        this.chart = this.svg.append('g')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');
    }

    // public functions and variables
    position (position){
        this.position = position;
        return this.svg.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
    };
}

