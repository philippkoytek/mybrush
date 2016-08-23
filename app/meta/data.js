/**
 * Created by Philipp Koytek on 6/28/2016.
 */


function State () {

    var theData = {};
    var theConnections = [];
    var lineFunction = d3.svg.line()
        .x(function (d) {
            return d.getBoundingClientRect().left;
        })
        .y(function (d) {
            return d.getBoundingClientRect().top;
        })
        .interpolate("linear");

    class Meta {
        constructor(){
            this.greys = new Set();
            this.brushes = new Set();
            this.visuals = new Set();
        }

        hasGreys(){
            return this.greys.size > 0;
        }

        hasBrushes(){
            return this.brushes.size > 0;
        }

        brush(viewId){
            this.greys.delete(viewId);
            this.brushes.add(viewId);
            if(constants.connect){
                this.connectFrom(viewId);
            }
        }

        grey(viewId){
            this.greys.add(viewId);
            this.brushes.delete(viewId);
        }

        unset(viewId){
            this.greys.delete(viewId);
            this.brushes.delete(viewId);
        }

        // keep track of all visuals that represent this data item (to be able to link them etc)
        registerVisual(viewId, visual){
            this.visuals.add({viewId:viewId, visual:visual});
        }

        connectFrom(viewId){
            this.visuals.forEach(function(dest){
                if(dest.viewId != viewId){
                    var isNew = theConnections.every(function(c){
                        return c[0] != srcVisual || c[1] != dest.visual;
                    });
                    if(isNew){
                        theConnections.push([srcVisual, dest.visual]);
                    }
                }
            });
        }

        disconnectFrom(srcVisual){
            this.visuals.forEach(function(dest){
                if(dest.visual != srcVisual){
                    var i = theConnections.findIndex(function(c){
                        return c.indexOf(srcVisual) >= 0 && c.indexOf(dest.visual) >=0;
                    });
                    if(i>=0){
                        console.log(i);
                        theConnections.splice(i, 1);
                    }
                }
            });
        }
    }

    function fillInMetaData(array){
        array.forEach(function(elem){
            elem.meta = new Meta();
        });
    }

    return class State {
        constructor(){}
        static request(url, key, callback){
            d3.json(url, function(error, data){
                fillInMetaData(data);
                theData[key] = data;
                callback(error, data, key);
            });
        }

        static updateConns(){
            var lines = d3.select('svg#main').selectAll('.connection').data(theConnections);
            lines.enter().append('path')
                .classed('connection', true)
                .style('stroke', 'black')
                .attr('d', lineFunction);

            lines.exit().transition()
                .attr('d', function(d){
                    return lineFunction([d[0], d[0]]);
                })
                .remove();
        }
    };
}