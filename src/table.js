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
            dbName: dbName,
            name: name,
            length: 0,
            data: [],
            fields: fields
        });

        this.fieldHash = this._buildFieldHash();
        //this.redundancyTable = this._createRedundancyTable();
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

        fetch: function(){

            var data = LS.getItem( this.key );

            if( data ){

                this.data = JSON.parse( data );
            }

            this._buildFieldHash();
        },

        insert: function(){

            var newData = this.insert.apply( this, arguments );

            return newData.data;
        },

        /**
         * 插入数据
         * @param {Array|Object} newData [ 'neekey', 'male' ] | { name: 'neekey', sex: 'male' }
         * @return {Number} 新插入的数据索引
         * @private
         */
        _insert: function( newData ){

            var data;
            var fields = this.get( 'fields' );
            var field;
            var index;
            var newIndex;
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

            newIndex = this.get( 'length' ) - 1;

            // 想冗余表中添加数据
            this._insertRedundancyItem( newIndex, data );

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

                this._removeRedundancyItem( itemIndex );
            }

            this.set( {
                data: data,
                length: dataLen
            });

            this.save();

            return resultLen;
        },


        update: function( condition, updateObj ){

            var result = this._query( condition );
            var fieldHash = this.get( 'fieldHash' );
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

                this._updateRedundancyItem( index, updateObj );
            }

            this.set( 'data', data );

            this.save();
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
         */
        _query: function( condition, order ){
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
        },

        /**
         * 为所有字段都穿件冗余表，该方法只有在新建表的时候被调用
         * @return {Object}
         * @private
         */
        _createRedundancyTable: function( ){

            if( !this.redundancyTable ){

                this.redundancyTable = {};
            }

            var fields = this.get( 'fields' );
            var dbName = this.get( 'dbName' );
            var tableName = this.get( 'name' );
            var data;
            var field;
            var index;
            var RedundancyTable = LocalStorage.redundancyTableItem;

            for( index = 0; field = fields[ index ]; index++ ){

//                data = this._buildRedundancyData( field );
                this.redundancyTable[ field ] = new RedundancyTable( dbName, tableName, field );
                this.redundancyTable[ field ].save();
            }

            return this.redundancyTable;
        },

        _buildRedundancyData: function( field ){

            var fieldIndex = this.fieldHash[ field ];
            var tableData = this.get( 'data' );
            var data = [];
            var item;
            var index;

            for( index = 0; item = tableData[ index ]; index++ ){

                data.push( [ index, item[ fieldIndex ] ] );
            }

            return data;
        },

        /**
         * 获取到存储在localStorage中的数据
         * 遍历表的所有字段，已经建立了冗余表的，则直接fetch，否则新建表，并fetch
         * @private
         */
        _fetchRedundancyTable: function(){

            var fields = this.get( 'fields' );
            var dbName = this.get( 'dbName' );
            var tableName = this.get( 'name' );
            var RedundancyTable = LocalStorage.redundancyTableItem;
            var field;
            var index;
            var rdTable;

            if( !this.redundancyTable ){

                this.redundancyTable = {};
            }

            for( index = 0; field = fields[ index ]; index++ ){

                if( field in this.redundancyTable ){

                    rdTable = this.redundancyTable[ field ];
                    rdTable.fetch();
                }
                else {

                    rdTable = this.redundancyTable[ field ] = new RedundancyTable( dbName, tableName, field );
                    rdTable.fetch();

                    // 当localStorage中没有数据时，fetch不会有任何影响，必须先将新建的空冗余表储存到localStorage中
                    rdTable.save();
                }
            }
        },

        _removeRedundancyItem: function( index ){

            var rdTable;
            var field;

            for( field in this.redundancyTable ){

                rdTable = this.redundancyTable[ field ];
                rdTable.remove( index );
            }
        },

        _insertRedundancyItem: function( index, data ){

            var rdTable;
            var field;
            var fieldHash = this.get( 'fieldHash' );
            var value;

            for( field in this.redundancyTable ){

                rdTable = this.redundancyTable[ field ];
                value = data[ fieldHash[ field ] ];

                rdTable.insert( index, value );
            }
        },

        _updateRedundancyItem: function( index, updateObj ){

            var fieldHash = this.get( 'fieldHash' );
            var field;
            var rdTable;
            var value;

            for( field in updateObj ){

                rdTable = this.redundancyTable[ field ];
                value = updateObj[ field ];

                rdTable.update( index, value );
            }
        }
    });
})( window );