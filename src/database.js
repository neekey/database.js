(function( host ){

    var Database = host.Database;
    var Config = Database.config;
    var Util = Database.util;
    var LocalStorage = Database.localStorage;
    var Item = LocalStorage.item;
    var LS = localStorage;

    var DatabaseItem = LocalStorage.databaseItem = function( name ){

        var key = DatabaseItem.getDatabaseKey( name );

        Item.call( this, key, {
            name: name,
            length: 0,
            tables: {}
        });
    };

    Util.mix( DatabaseItem, {

        /**
         * 构造数据库在localStorage中的key
         * @param name
         * @return {String}
         */
        getDatabaseKey: function( name ){

            var nameConfig = Config.name;
            var key = nameConfig.libraryName + '-' +
                nameConfig.databasePrefix + '-' +
                name;

            return key;
        },
        /**
         * 检查数据库是否已经存在
         * @param name
         * @return {Boolean}
         */
        ifDatabaseExist: function( name ){

            var key = this.getDatabaseKey( name );
            var db = LS.getItem( key );

            if( db !== undefined && db !== null ){

                return true;
            }
            else {

                return false;
            }
        }
    });

    Util.mix( DatabaseItem.prototype, Item.prototype );
    Util.mix( DatabaseItem.prototype, {

        createTable: function( name, fields ){

            var tables = this.get( 'tables' );

            if( name in tables ){

                return;
            }

            var newTable = new LocalStorage.tableItem( this.get( 'name' ), name, fields );

            newTable.save();

            tables[ name ] = {
                name: name
            };


            this.set( { length: this.get( 'length' ) + 1 } );
            this.save();

            return newTable;
        },

        openTable: function( name ){

            var tables = this.get( 'tables' );

            if( !tables[ name ] ){

                return;
            }

            var newTable = new LocalStorage.tableItem( this.get( 'name' ), name );

            newTable.fetch();

            return newTable;
        },

        removeTable: function( name ){

            var tables = this.get( 'tables' );
            var table = tables[ name ];
            var tableKey = LocalStorage.tableItem.getTableKey( this.get( 'name' ), name );
            var tableData = LS.getItem( tableKey );

            if( tableData !== undefined && tableData !== null ){

                LS.removeItem( tableKey );
            }

            if( table ){

                delete tables[ name ];

                this.set( {
                    tables: tables,
                    length: this.get( 'length' ) - 1
                });

                this.save();
            }
        }
    });

    Util.mix( Database, {

        createDatabase: function( name ){

            if( DatabaseItem.ifDatabaseExist( name ) ){

                return;
            }

            var newDB = new DatabaseItem ( name );
            newDB.save();

            return newDB;
        },

        openDatabase: function( name ){

            if( !DatabaseItem.ifDatabaseExist( name ) ){

                return;
            }

            var newDB = new DatabaseItem ( name );
            newDB.fetch();

            return newDB;
        }
    });
})( window );