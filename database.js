(function(){

    // todo 思考remove update等操作的接口
    // todo 编写测试用例
    var LS = localStorage;
    var Util = {

        mix: function( t, s ){

            var key;

            for( key in s ){

                t[ key ] = s[ key ];
            }
        },

        uuid: function(){

            return (new Date).valueOf();
        }
    };

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

    var DatabaseItem = function( name ){

        var key = DatabaseItem.getDatabaseKey( name );

        Item.call( this, key, {
            name: name,
            length: 0,
            tables: {}
        });
    };

    Util.mix( DatabaseItem, {
        databasePrefix: 'database',
        getDatabaseKey: function( name ){

            return this.databasePrefix + name;
        },
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

            var newTable = new TableItem( this.get( 'name' ), name, fields );

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

            var newTable = new TableItem( this.get( 'name' ), name );

            newTable.fetch();

            return newTable;
        },

        removeTable: function( name ){

            var tables = this.get( 'tables' );
            var table = tables[ name ];
            var tableKey = TableItem.getTableKey( this.get( 'name' ), name );
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


    var TableItem = function( dbName, name, fields ){

        var key = TableItem.getTableKey( dbName, name );

        Item.call( this, key, {
            name: name,
            length: 0,
            data: [],
            fields: fields
        });
    };

    Util.mix( TableItem, {

        tablePrefix: 'table',
        getTableKey: function( dbname, name ){

            return this.tablePrefix + String( dbname ) + String( name );
        },
        ifTableExist: function( dbName, name  ){

            var key = this.getTableKey( dbName, name );
            var t = LS.getItem( key );

            if( t === undefined || t === null ){

                return false;
            }
            else {

                return true;
            }
        },
        analyseCondition: function( str ){

            var args = str.split( ' ' );
            return {
                operator: args[ 0 ],
                value: args[ 1 ]
            };
        },
        queryRules: {
            '=': function( left, right ){
                return left == right;
            },

            '!=': function( left, right ){
                return left != right;
            },

            '>': function( left, right ){
                return left > right;
            },

            '>=': function( left, right ){
                return left >= right;
            },

            '<': function( left, right ){
                return left < right;
            },

            '<=': function( left, right ){
                return left <= right;
            },

            '*=': function( left, right ){
                return String( left).indexOf( String( right ) ) >= 0;
            },

            '^=': function( left, right ){
                return String( left).indexOf( String( right ) ) === 0;
            },

            '$=': function( left, right ){
                return String( left).indexOf( String( right ) ) >= 0 && ( String( left).indexOf( String( right ) ) === ( String( left).length - String( right).length ) );
            }
        }
    });

    Util.mix( TableItem.prototype, Item.prototype );
    Util.mix( TableItem.prototype, {
        insert: function( newData ){

            var data;
            var fields = this.get( 'fields' );
            var field;
            var index;
            var TableData = this.get( 'data' );

            // 若为数组，则按照fields的顺序对应
            if( newData.constructor === Array ){
                data = newData.slice( 0, fields.length );
            }

            if( newData.constructor === Object ){

                data = [];
                for( index = 0; field = fields[ index ]; index++ ){
                    if( field in newData ){
                        data[ index ] = newData[ field ];
                    }
                }
            }

            TableData.push( data );
            this.set( {
                data: TableData,
                length: this.get( 'length' ) + 1
            });

            this.save();
        },
        remove: function( ){

        },
        update: function(){

        },
        query: function( condition ){
            var key;
            var value;
            var index;
            var item;
            var valid;
            var operator;
            var con;
            var result = [];
            var data = this.get( 'data' );
            var fields = this.get( 'fields' );
            var field;
            var fieldHash = {};

            for( index = 0; field = fields[ index ]; index++ ){

                fieldHash[ field ] = index;
            }

            for( index = 0; item = data[ index ]; index++ ){

                valid = true;

                for( key in condition ){

                    con = TableItem.analyseCondition( condition[ key ] );
                    operator = con.operator;
                    value = con.value;

                    valid = TableItem.queryRules[ operator ]( item[ fieldHash[ key ] ], value );

                    if( valid === false ){

                        break;
                    }
                }

                if( valid === true ){

                    result.push( item );
                }
            }

            return result;
        }
    });

    var Database = {

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
    };

    window[ 'Database' ] = Database;

})();
