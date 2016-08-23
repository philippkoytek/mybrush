
var Meta = (function(){
    var connections = [];
    
    var lineFunction = d3.svg.line()
        .x(function (d) {
            return d.getBoundingClientRect().left;
        })
        .y(function (d) {
            return d.getBoundingClientRect().top;
        })
        .interpolate("linear");

    
    function connect (source, destination){
        connections.push(new Connection(source, destination));
    }
    
    function disconnect (source, destination){
        connections.pop();
    }

    function drawConnections(){
        var lines = d3.select('svg#main').selectAll('.connection').data(connections);
        lines.enter().append('path')
            .classed('connection', true);

        lines.style('stroke', 'black')
            .attr('d', function(c){
                return lineFunction([c.source, c.destination]);
            });

        lines.exit().remove();
    }
    
    return {
        connect:connect,
        disconnect:disconnect,
        drawConnections:drawConnections
    };
})();