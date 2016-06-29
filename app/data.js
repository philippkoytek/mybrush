/**
 * Created by Philipp Koytek on 6/28/2016.
 */


function State () {

    var theData = {};

    class Meta {
        constructor(){
            this.greys = new Set();
            this.brushes = new Set();
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
        }

        grey(viewId){
            this.greys.add(viewId);
            this.brushes.delete(viewId);
        }

        unset(viewId){
            this.greys.delete(viewId);
            this.brushes.delete(viewId);
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

    }

}