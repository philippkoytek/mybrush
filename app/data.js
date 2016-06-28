/**
 * Created by Philipp Koytek on 6/28/2016.
 */


function State () {

    var theData = {};

    class Meta {
        constructor(){
            this.grey = new Set();
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