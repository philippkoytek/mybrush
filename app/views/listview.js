/**
 * Created by Philipp Koytek on 6/28/2016.
 */

class ListView extends View {
    constructor (width, height, position, padding){
        super('list',width, height, position, padding);

        this.idValue = function(d){
            return d.fifaPid;
        };

        this.rows = 10;

        this.xValue = function (d, i){
            return Math.floor(i/this.rows);
        };

        this.yValue = function (d, i) {
            return (i % this.rows) + 1;
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
            .rangeRoundBands([0, this.chartWidth], 0.2)
            .domain(arrayOfNumbers(0, Math.ceil(data.length/this.rows) - 1));

        this.yRange = d3.scale.ordinal()
            .rangeRoundBands([0, this.chartHeight], 0.0, 0.1)
            .domain(arrayOfNumbers(0, this.rows));

        self.insertNewBrush();

        var content = self.chart.append('g').classed('content', true);
        var cards = content.selectAll('.card').data(data, self.idValue);
        cards.enter().append('text')
            .classed('card data-item aggregate individual', true)
            .attr('x', function(d, i){
                return self.xRange(self.xValue(d, i));
            })
            .attr('y', function(d, i){ return self.yRange(self.yValue(d, i)); })
            .text(function(d){return d.name;})
            .call(self.addInteractivity.bind(self));

        return self;
    }

    /*
     * Override methods
     */
    createBrush () {
        var self = this;
        var brush = d3.svg.brush()
            .y(this.yRange)
            .x(this.xRange);
        brush.on('brush', function(){
            self.onBrush(brush);
        })
            .on('brushend', function(){
                self.onBrushEnd(brush);
            });
        return brush;
    }
}