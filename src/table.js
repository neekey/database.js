(function( host ){

    var Database = host.Database;
    var Util = Database.util;
    var LocalStorage = Database.localStorage;
    var Item = LocalStorage.item;
    var LS = localStorage;

    var TableItem = LocalStorage.tableItem = function( dbName, name, fields ){

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
})( window );