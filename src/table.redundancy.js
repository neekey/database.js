(function( host ){

    var Database = host.Database;
    var Config = Database.config;
    var Util = Database.util;
    var LocalStorage = Database.localStorage;
    var Item = LocalStorage.item;
    var LS = localStorage;

    /**
     * @param {String} dbName
     * @param {String} tableName
     * @param {String} fieldName
     * @param {Array} data [[ index, value ], [ index2, value2 ], ... ]
     * @type {Function}
     */
    var RedundancyTableItem = LocalStorage.redundancyTableItem = function( dbName, tableName, fieldName, data ){

        var key = RedundancyTableItem.getRedundancyTableKey( dbName, tableName, fieldName );
        var defaultData = {
            dbName: dbName,
            tableName: tableName,
            fieldName: fieldName,
            length: data ? data.length : 0,
            // 数据在主表中的index 与 在冗余表的data中的index的对应
            indexHash: {},
            // [ [index, value] ]
            data: data || []
        };

        if( data ){
            Item.call( this, key, defaultData );
        }
        else {
            Item.call( this, key );
        }

        if( this.get( 'fieldName' ) === undefined ){

            this.set( defaultData );
        }
    };

    Util.mix( RedundancyTableItem.prototype, Item.prototype );
    Util.mix( RedundancyTableItem, {

        /**
         * 构造冗余表的key
         * @param dbname
         * @param tableName
         * @param fieldName
         * @return {String}
         */
        getRedundancyTableKey: function( dbName, tableName, fieldName ){

            var nameConfig = Config.name;
            var key = nameConfig.libraryName + '-' +
                nameConfig.redundancyTablePrefix + '-' +
                String( dbName ) + '-' +
                String( tableName ) + '-' +
                String( fieldName );

            return key;
        }
    });

    Util.mix( RedundancyTableItem.prototype, {

        remove: function( index ){

            var indexHash = this.get( 'indexHash' );
            var data = this.get( 'data' );
            var dataLen = data.length;
            var dataIndex = indexHash[ index ];

            delete indexHash[ index ];
            delete data[ dataIndex ];

            this.set({
                data: data,
                indexHash: indexHash,
                length: this.get( 'length' ) - 1
            });

//            this.save();
        },

        setData: function( data ){

            var indexHash = {};
            var dataIndex;
            var dataItem;
            var index

            for( index = 0; dataItem = data[ index ]; index++ ){

                dataIndex = dataItem[ 0 ];
                indexHash[ dataIndex ] = index;
            }

            this.set({
                data: data,
                indexHash: indexHash,
                length: data.length
            });
        },

        insert: function( index, value ){

            var indexHash = this.get( 'indexHash' );
            var data = this.get( 'data' );
            var dataLen = data.length;

            data.push([ index, value ]);
            indexHash[ index ] = dataLen;

            this.set({
                data: data,
                indexHash: indexHash,
                length: this.get( 'length' ) + 1
            });

//            this.save();
        },

        update: function( index, value ){

            var indexHash = this.get( 'indexHash' );
            var dataIndex = indexHash[ index ];
            var data = this.get( 'data' );

            data[ dataIndex ][ 1 ] = value;

            this.set( 'data', data );

//            this.save();
        }
    });
})( window );