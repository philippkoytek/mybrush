/**
 * Created by Philipp Koytek on 6/28/2016.
 */

class ListView extends View {
    constructor (width, height, position, padding){
        super('listview',width, height, position, padding);

        this.idValue = function(d){
            return d.fifaPid;
        };

        this.rows = 10;

        this.xValue = function (d, i){
            return this.xRange(Math.floor(i/this.rows));
        };

        this.fontSize = 16;

        this.yValue = function (d, i) {
            return this.yRange((i % this.rows) + 1) + (this.fontSize*3/4);
        };
        
        this.strokeValue = function(d){
            return 'none';
        };
        
        this.fillValue = function(d){
            return 'black';
        };


    }

    data(data){
        var self = this;

        this.xRange = d3.scale.ordinal()
            .rangeRoundBands([0, this.chartWidth], 0.1)
            .domain(arrayOfNumbers(0, Math.ceil(data.length/this.rows) - 1));

        this.yRange = d3.scale.ordinal()
            .rangeRoundBands([0, this.chartHeight], 0.2)
            .domain(arrayOfNumbers(1, this.rows));

        self.insertNewBrush();

        var content = self.chart.append('g').classed('content', true);
        var cards = content.selectAll('.card').data(data, self.idValue);
        cards.enter().append('g')
            .classed('card', true);
        cards.append('circle')
            .classed('anchor-point', true)
            .attr('cx', self.xValue.bind(self))
            .attr('cy', function(d,i){
                return self.yValue(d,i);// + self.fontSize/2;
            })
            .attr('r', 1.5);
        cards.append('text')
            .classed('data-item aggregate individual', true)
            .attr('x', function(d, i){ return self.xValue(d, i) + 6;})
            .attr('y', function(d,i){ return self.yValue(d,i) + self.fontSize/4;})
            .text(function(d){return d.name;})
            .style('font-size', self.fontSize + 'px')
            .style('font-weight', 'bold')
            .call(self.addInteractivity.bind(self));


        return self;
    }

    /*
     * Override methods
     */
    createBrush () {
        var self = this;
        var brush = d3.svg.pkbrush()
            .y(this.yRange)
            .x(this.xRange)
            .handleSize(constants.handleSize);
        brush.on('brushstart', function(){
                self.onBrushStart(brush);
            }).on('brush', function(){
                self.onBrush(brush);
            })
            .on('brushend', function(){
                self.onBrushEnd(brush);
            });
        return brush;
    }

    getMinimumBrushBox (visual) {
        var b = visual.getBBox();
        return {x:b.x - 10, y:b.y - 3, width: Math.max(this.xRange.rangeBand(), b.width) + 13, height: b.height + 6};
    }

    lineAnchorPoint (visual, d, brush) {
        var x = d3.select(visual.previousSibling).attr('cx');
        var y = d3.select(visual.previousSibling).attr('cy');
        return this.fromChartToAbsoluteCtx(x, y);
    }
}