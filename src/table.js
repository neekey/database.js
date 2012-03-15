(function( host ){

    var Database = host.Database;
    var Config = Database.config;
    var Util = Database.util;
    var LocalStorage = Database.localStorage;
    var Item = LocalStorage.item;
    var LS = localStorage;

    /**
     * table数据操作对象
     * 如果指定field，则是创建新表格，若不指定，则将从localStorage中fetch，若没有数据，则使用默认数据
     * @type {Function}
     */
    var TableItem = LocalStorage.tableItem = function( dbName, name, fields ){

        var key = TableItem.getTableKey( dbName, name );
        var defaultData = {
            dbName: dbName,
            name: name,
            length: 0,
            data: [],
            fields: fields || []
        };

        if( fields ){

            Item.call( this, key, defaultData );
        }
        else {

            Item.call( this, key );
        }

        if( this.get( 'name' ) === undefined ){

            this.set( defaultData );
        }

        this._buildFieldHash();
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
         * 若存在多个条件，用分号分割比如 '> 100; <= 500'
         * @param str
         * @return {Object}
         */
        analyseCondition: function( str ){

            var cons = str.split( ';' );
            var trimEx = /^\s*|\s$/g;
            var con;
            var index;
            var args;
            var result = [];

            for( index = 0; con = cons[ index ]; index++ ){

                args = con.replace( trimEx, '' ).split( ' ' );

                result.push({
                    operator: args[ 0 ],
                    value: args[ 1 ]
                })
            }
            return result;
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

            /**
             * 等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '=': function( left, right ){
                return left == right;
            },

            /**
             * 不等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!=': function( left, right ){
                return left != right;
            },

            /**
             * 大于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '>': function( left, right ){
                return left > right;
            },

            /**
             * 大于等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '>=': function( left, right ){
                return left >= right;
            },

            /**
             * 小于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '<': function( left, right ){
                return left < right;
            },

            /**
             * 小于等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '<=': function( left, right ){
                return left <= right;
            },

            /**
             * 包含某个字符串
             * @param left
             * @param right
             * @return {Boolean}
             */
            '*=': function( left, right ){
                return String( left).indexOf( String( right ) ) >= 0;
            },

            /**
             * 不包含某个字符串
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!*=': function( left, right ){
             return String( left).indexOf( String( right ) ) < 0;
            },

            /**
             * 以某个字符串开始
             * @param left
             * @param right
             * @return {Boolean}
             */
            '^=': function( left, right ){
                return String( left).indexOf( String( right ) ) === 0;
            },

            /**
             * 不以某个字符串开始
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!^=': function( left, right ){
                return String( left).indexOf( String( right ) ) !== 0
            },

            /**
             * 以某个字符串结尾
             * @param left
             * @param right
             * @return {Boolean}
             */
            '$=': function( left, right ){
                return String( left).indexOf( String( right ) ) >= 0 && ( String( left).indexOf( String( right ) ) === ( String( left).length - String( right).length ) );
            },

            /**
             * 不以某个字符串结尾
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!$=': function( left, right ){
                return !( String( left).indexOf( String( right ) ) >= 0 && ( String( left).indexOf( String( right ) ) === ( String( left).length - String( right).length ) ) );
            }
        }
    });

    Util.mix( TableItem.prototype, Item.prototype );
    Util.mix( TableItem.prototype, {

//        fetch: function(){
//
//            this._fetch();
//            this._buildFieldHash();
//        },

        //todo 数据插入的效率问题
        insert: function(){

            var newData = this._insert.apply( this, arguments );

            return newData.data;
        },

        /**
         * 插入数据
         * @param {Array|Object} newData [ 'neekey', 'male' ] | { name: 'neekey', sex: 'male' }
         * @param {Boolean} ifBatch 是否批量插入
         * @return {Number} 新插入的数据索引
         * @private
         */
        _insert: function( newData, ifBatch ){

            ifBatch = ifBatch === undefined ? false : ifBatch;
            var data;
            var fields = this.get( 'fields' );
            var item;
            var field;
            var index;
            var newIndex;
            var TableData = this.get( 'data' );
            var tableDataLen = this.get( 'length' );

            // 若为批量插入
            if( ifBatch && newData.constructor === Array ){

                for( index = 0; item = newData[ index ]; index++ ){

                    // 若为数组，则按照fields的顺序对应
                    if( item.constructor === Array ){
                        data = item.slice( 0, fields.length );
                    }

                    if( item.constructor === Object ){

                        data = [];
                        for( index = 0; field = fields[ index ]; index++ ){
                            if( field in item ){
                                data[ index ] = item[ field ];
                            }
                        }
                    }

                    TableData.push( data );
                    tableDataLen++;
                }
            }
            // 若为单个插入
            else {

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
                tableDataLen++;
            }

            this.set( {
                data: TableData,
                length: tableDataLen
            });

            newIndex = TableData.length - 1;

            return {
                index: newIndex,
                data: data
            };
        },

        /**
         * 根据条件删除数据
         * @param condition
         * @return {Number} 返回被删除的数据条数
         */
        remove: function( condition ){

            var result = this._query( condition );
            var resultLen = result.length;
            var index;
            var item;
            var data = this.get( 'data' );
            var dataLen = this.get( 'length' );
            var itemIndex;

            for( index = 0; item = result[ index ]; index++ ){

                itemIndex = item.index;

                delete data[ itemIndex ];
                dataLen--;
            }

            this.set( {
                data: data,
                length: dataLen
            });

            return resultLen;
        },


        update: function( condition, updateObj ){

            var result = this._query( condition );
            var fieldHash = this.fieldHash;
            var data = this.get( 'data' );
            var dataItem;
            var field;
            var item;
            var index;

            for( index = 0; item = result[ index ]; index++ ){

                dataItem = data[ item.index ];

                for( field in updateObj ){

                    dataItem[ fieldHash[ field ] ] = updateObj[ field ];
                }
            }

            this.set( 'data', data );
        },

        query: function(){

            var _result = this._query.apply( this, arguments );
            var result = [];
            var index;
            var item;

            for( index = 0; item = _result[ index ]; index++ ){

                result.push( item.data );
            }

            return result;
        },

        /**
         * 对表中的数据进行检索，返回数据 + 数据对应在表中的索引值
         * @param {Object} condition {
         *      'field1': '>= 13',
         *      'field2': '*= 你好'
         * }
         * @param {String} order 对结果进行排序 'desc fieldName'
         * @return {Array} [ { index: 13, data: .. }, { .. }, .. ]
         * @private
         * //todo 使用冗余表 加速检索
         */
        _query: function( condition, order ){
            var key;
            var value;
            var index;
            var item;
            var valid;
            var operator;
            var con;
            var conArr = [];
            var conArrTemp;
            var result = [];
            var data = this.get( 'data' );
            var dataLen = data.length;
            var fields = this.get( 'fields' );
            var fieldHash = this.fieldHash;
            var i;

            for( key in condition ){

                conArrTemp = TableItem.analyseCondition( condition[ key ] );

                for( index = 0; con = conArrTemp[ index ]; index++ ){

                    con.key = key;

                    conArr.push( con );
                }
            }

            for( index = 0; index < dataLen; index++ ){

                item = data[ index ];

                if( item === undefined ){

                    continue;
                }

                valid = true;

                for( i = 0; con = conArr[ i ]; i++ ){

                    operator = con.operator;
                    value = con.value;
                    key = con.key;

                    valid = TableItem.queryRules[ operator ]( item[ fieldHash[ key ] ], value );

                    if( valid === false ){

                        break;
                    }
                }

                if( valid === true ){

                    result.push( {
                        index: index,
                        data: item
                    } );
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
        },

        /**
         * 建立field -> 数据index 的hax表
         * @return {Object}
         * @private
         */
        _buildFieldHash: function(){

            var index;
            var fields = this.get( 'fields' );
            var fieldHash = {};

            if( fields ){
                for( index = 0; field = fields[ index ]; index++ ){

                    fieldHash[ field ] = index;
                }

                return this.fieldHash = fieldHash;
            }
        }
    });
})( window );