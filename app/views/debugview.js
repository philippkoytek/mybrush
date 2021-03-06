class DebugView extends View {
    constructor (width, height, position){
        super('debug',width, height, position, {top:10, right:10, bottom:10, left:10});
        var self = this;
        this.text = this.chart.append('foreignObject')
            .attr({width:width-20, height:height-20})
            .append('xhtml:div')
            .style({
                height:''+(height-20)+'px',
                overflow: 'auto'
            })
            .text('debug outputs')
            .on('click', function(){
                d3.select(this).selectAll('*').remove();
                self.log(JSON.stringify(DATA[0]));
            });
    }

    log(text){
        this.text.append('br');
        this.text.append('code').text(text);
        var n = this.text.node();
        n.scrollTop = n.scrollHeight;
    }
}