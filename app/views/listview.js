/**
 * Created by Philipp Koytek on 6/28/2016.
 */

class ListView extends View {
    constructor (width, height, position, padding){
        super('list',width, height, position, padding);

        this.idValue = function(d){
            return d.fifaPid;
        };

        this.namesPerColumn = 13;
    }

    data(data){
        var self = this;

        var content = self.chart.append('g').classed('content', true);
        var cards = content.selectAll('.cards').data(data, self.idValue);
        cards.enter().append('text')
            .classed('card data-item', true)
            .attr('x', function(d, i){ return 150 * (Math.floor(i/self.namesPerColumn)); })
            .attr('y', function(d, i){ return 30 * (i % self.namesPerColumn); })
            .text(function(d){return d.name;})
            .on('click', self.highlight.bind(self));

        return self;
    }

    //
    //
    // update(){
    //     self.chart.selectAll('.data-item').attr({
    //         fill: function(d){return d.}
    //     })
    //
    // }
}