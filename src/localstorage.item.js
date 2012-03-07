(function( host ){

    var Database = host.Database;
    var LocalStorage = Database.localStorage;
    var Util = Database.util;
    var LS = host.localStorage;

    var Item = function( key, data ){

        var that = this;

        this.key = key;
        this.data = data || {};
    };

    Item.prototype = {
        fetch: function(){

            var data = LS.getItem( this.key );

            if( data ){

                this.data = JSON.parse( data );
            }
        },

        save: function(){
            LS.setItem( this.key, JSON.stringify( this.data ) );
        },

        remove: function(){
            LS.removeItem( this.key );
        },

        set: function( key, value ){

            if( key.constructor === Object ){

                Util.mix( this.data, key );
            }
            else if( typeof key === 'string' && value !== undefined ){

                this.data[ key ] = value;
            }
        },

        get: function( name ){

            return this.data[ name ];
        },

        toJSON: function(){

            return this.data;
        }
    };

    LocalStorage.item = Item;

})( window );