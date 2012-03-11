(function( host ){

    var Database = host.Database;
    var LocalStorage = Database.localStorage;
    var Util = Database.util;
    var LS = host.localStorage;

    /**
     * localStorage中每一个条目的封装操作对象
     * 如果localStorage中已经含有key的数据，且data没有指定，则自动fetch，否则使用data
     * 若data没有给定，则使用空数据
     * @param key
     * @param data
     * @constructor
     */
    var Item = function( key, data ){

        this.key = key;

        if( data ){

            this.data = data;
        }
        else {

            this.fetch();

            if( !this.data ){

                this.data = {};
            }
        }

        this.save();
    };

    Item.prototype = {

        /**
         * 从localStorage中fetch数据，设置给data
         */
        fetch: function(){

            var data = LS.getItem( this.key );

            if( data ){

                this.data = JSON.parse( data );
            }
        },

        /**
         * 将data进行JSON字符串化，储存在localStorage中
         */
        save: function(){
            LS.setItem( this.key, JSON.stringify( this.data ) );
        },

        /**
         * 从localStorage中删除
         */
        remove: function(){
            LS.removeItem( this.key );
        },

        /**
         * 设置data的值
         * @param key
         * @param value
         */
        set: function( key, value ){

            if( key.constructor === Object ){

                Util.mix( this.data, key );
            }
            else if( typeof key === 'string' && value !== undefined ){

                this.data[ key ] = value;
            }

            this.save();
        },

        /**
         * 从data中回去指定字段
         * @param name
         * @return {*}
         */
        get: function( name ){

            return this.data[ name ];
        },

        /**
         * 返回data
         * @return {*}
         */
        toJSON: function(){

            return this.data;
        }
    };

    LocalStorage.item = Item;

})( window );