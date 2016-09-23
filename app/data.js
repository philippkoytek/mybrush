
class Data {
    constructor(){}

    static request(url, key, callback){
        d3.json(url, function(error, data){
            data = _.map(data, function(d){
               return new DataItem(d);
            });

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
        this.mainPosition = positionBin(this.positions[0]);
    }

    registerVisual(element, view){
        element.view = view;
        this.visuals.add(element);
    }

    unregisterVisual(element){
        this.visuals.delete(element);
    }

    registerBrush(brush){
        this.brushes.add(brush);
    }

    unregisterBrush(brush){
        this.brushes.delete(brush);
    }
}


