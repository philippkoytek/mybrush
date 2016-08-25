
class Data {
    constructor(){}

    static request(url, key, callback){
        d3.json(url, function(error, data){
            data = _.map(data, function(d){
               return new DataItem(d);
            });

            //TODO: remove this part
            Data.fillInMetaData(data);

            callback(error, data, key);
        });
    }

    static fillInMetaData(array){
        array.forEach(function(elem){
            elem.meta = new Meta();
        });
    }
}

class DataItem {
    constructor(item){
        _.extend(this, item);
        this.visuals = new Set();
        this.brushes = new Set();
    }

    registerVisual(element, view){
        element.view = view;
        this.visuals.add(element);
    }

    unregisterVisual(element){
        this.visuals.delete(element);
    }
}

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


