
class Connection {
    
    constructor(src, dest, type){
        this.source = src;
        this.destination = dest;
        this._type = type || 'simple';
    }
    
    type (t) {
        if(!t){
            return this._type;
        }
        this._type = type;
        return this;
    }
    
    
}