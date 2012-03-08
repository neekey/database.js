(function( host ){

    var Database = host.Database;
    var Config = Database.config;
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

        /**
         * 构造数据表的key
         * @param dbname
         * @param name
         * @return {String}
         */
        getTableKey: function( dbname, name ){

            var nameConfig = Config.name;
            var key = nameConfig.libraryName + '-' +
                nameConfig.tablePrefix + '-' +
                String( dbname ) + '-' +
                String( name );

            return key;
        },

        /**
         * 构造冗余表的key
         * @param dbname
         * @param tableName
         * @param fieldName
         * @return {String}
         */
        getRedundancyTableKey: function( dbname, tableName, fieldName ){

            var key = this.getTableKey( dbname, tableName );
            key += ( '-' + fieldName );

            return key;
        },

        /**
         * 检查表是否存在
         * @param dbName
         * @param name
         * @return {Boolean}
         */
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

        /**
         * 解析query字符串 '>= 13' -> { operator: '>=', value: 13 }
         * @param str
         * @return {Object}
         */
        analyseCondition: function( str ){

            var args = str.split( ' ' );
            return {
                operator: args[ 0 ],
                value: args[ 1 ]
            };
        },

        /**
         * 解析排序参数
         * @param order 'desc fieldName' -> { type: 'desc', field: 'filedName' }
         * @return {Object}
         */
        analyseOrder: function( order ){

            var orderArr = order.split( ' ' );
            var type = orderArr[ 0 ];
            var field = orderArr[ 1 ];

            return  {
                type: type,
                field: field
            };
        },

        /**
         * 定义操作符对应的算法
         */
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
        /**
         * 对表中的数据进行检索
         * @param {Object} condition {
         *      'field1': '>= 13',
         *      'field2': '*= 你好'
         * }
         * @param {String} order 对结果进行排序 'desc fieldName'
         * @return {Array}
         */
        query: function( condition, order ){
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

            // 对结果进行排序
            if( typeof order === 'string' ){

                var order = TableItem.analyseOrder( order );
                result = Util.sort( result, order.type, function( item ){

                    return item[ fieldHash[ order.field ] ];
                });
            }

            return result;
        }
    });
})( window );