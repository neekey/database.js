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
    var RedundancyTableItem = LocalStorage.redundancyTableItem = function( dbName, tableName, fieldName ){

        var key = RedundancyTableItem.getRedundancyTableKey( dbName, tableName, fieldName );

        Item.call( this, key, {
            dbName: dbName,
            tableName: tableName,
            fieldName: fieldName,
            length: 0,
            // 数据在主表中的index 与 在冗余表的data中的index的对应
            indexHash: {},
            // [ [index, value] ]
            data: []
        });
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
                nameConfig.tablePrefix + '-' +
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
            var dataIndex = indexHash[ index ];

            delete indexHash[ index ];
            delete data[ dataIndex ];

            this.set({
                data: data,
                indexHash: indexHash
            });

            this.save();
        },

        insert: function( index, value ){

            var indexHash = this.get( 'indexHash' );
            var data = this.get( 'data' );
            var dataLen = data.length;

            data.push([ index, value ]);
            indexHash[ index ] = dataLen;

            this.set({
                data: data,
                indexHash: indexHash
            });

            this.save();
        },

        update: function( index, value ){

            var indexHash = this.get( 'indexHash' );
            var dataIndex = indexHash[ index ];
            var data = this.get( 'data' );

            data[ dataIndex ][ 1 ] = value;

            this.set( 'data', data );

            this.save();
        }
    });
})( window );