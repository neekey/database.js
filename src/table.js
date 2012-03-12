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
    var TableItem = LocalStorage.tableItem = function( dbName, name, fields, index ){

        var key = TableItem.getTableKey( dbName, name );
        var defaultData = {
            dbName: dbName,
            name: name,
            length: 0,
            data: [],
            fields: fields || [],
            index: index || []
        };

        if( fields ){

            Item.call( this, key, defaultData );
        }
        else {

            Item.call( this, key );
        }

//        this._fetch = LocalStorage.item.prototype.fetch;
        if( this.get( 'name' ) === undefined ){

            this.set( defaultData );
        }

        this._buildFieldHash();
        this._buildRedundancyTable();
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
            '=': {
                useRedundancy: true,
                fn: function( left, right ){

                    return left == right;
                }
            },

            /**
             * 不等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!=': {
                useRedundancy: true,
                fn: function( left, right ){
                    return left != right;
                }
            },

            /**
             * 大于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '>': {
                useRedundancy: true,
                fn: function( left, right ){
                    return left > right;
                }
            },

            /**
             * 大于等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '>=': {
                useRedundancy: true,
                fn: function( left, right ){
                    return left >= right;
                }
            },

            /**
             * 小于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '<': {
                useRedundancy: true,
                fn: function( left, right ){
                    return left < right;
                }
            },

            /**
             * 小于等于
             * @param left
             * @param right
             * @return {Boolean}
             */
            '<=': {
                useRedundancy: true,
                fn: function( left, right ){
                    return left <= right;
                }
            },

            /**
             * 包含某个字符串
             * @param left
             * @param right
             * @return {Boolean}
             */
            '*=': {
                useRedundancy: false,
                fn: function( left, right ){
                    return String( left).indexOf( String( right ) ) >= 0;
                }
            },

            /**
             * 不包含某个字符串
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!*=': {
                useRedundancy: false,
                fn: function( left, right ){
                    return String( left).indexOf( String( right ) ) < 0;
                }
            },

            /**
             * 以某个字符串开始
             * @param left
             * @param right
             * @return {Boolean}
             */
            '^=': {
                useRedundancy: false,
                fn: function( left, right ){
                    return String( left).indexOf( String( right ) ) === 0;
                }
            },

            /**
             * 不以某个字符串开始
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!^=': {
                useRedundancy: false,
                fn: function( left, right ){
                    return String( left).indexOf( String( right ) ) !== 0
                }
            },

            /**
             * 以某个字符串结尾
             * @param left
             * @param right
             * @return {Boolean}
             */
            '$=': {
                useRedundancy: false,
                fn: function( left, right ){
                    return String( left).indexOf( String( right ) ) >= 0 && ( String( left).indexOf( String( right ) ) === ( String( left).length - String( right).length ) );
                }
            },

            /**
             * 不以某个字符串结尾
             * @param left
             * @param right
             * @return {Boolean}
             */
            '!$=': {
                useRedundancy: false,
                fn: function( left, right ){
                    return !( String( left).indexOf( String( right ) ) >= 0 && ( String( left).indexOf( String( right ) ) === ( String( left).length - String( right).length ) ) );
                }
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

                this._updateRedundancyItem( index, updateObj );
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
            var rdConArr = [];
            var conArrTemp;
            var result = [];
            var comResult = [];
            var rdResult;
            var resultTemp;
            var data = this.get( 'data' );
            var dataLen = data.length;
            var fields = this.get( 'fields' );
            var fieldHash = this.fieldHash;
            var i;

            for( key in condition ){

                conArrTemp = TableItem.analyseCondition( condition[ key ] );

                for( index = 0; con = conArrTemp[ index ]; index++ ){

                    con.key = key;

                    // 规则允许使用冗余表，且冗余表存在（或者说用户设置了对该字段建立索引）
                    if( TableItem.queryRules[ con.operator ][ 'useRedundancy' ] && this.redundancyTable[ key ]  ){

                        rdConArr.push( con );
                    }
                    else {

                        conArr.push( con );
                    }
                }
            }

            // 先查找不需要使用冗余表的条件
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

                    valid = TableItem.queryRules[ operator ][ 'fn' ]( item[ fieldHash[ key ] ], value );

                    if( valid === false ){

                        break;
                    }
                }

                if( valid === true ){

                    comResult.push( {
                        index: index,
                        data: item
                    } );
                }
            }

            // 对需要使用冗余表的条件进行查询
            for( i = 0; con = rdConArr[ i ]; i++ ){

                var resultTemp = this._queryRedundancyTable( con.key, con.operator, con.value );

                if( rdResult === undefined ){

                    rdResult = resultTemp;
                }
                else {

                    rdResult = Util.intersect( rdResult, resultTemp, function getValue( item ){
                        return item.index;
                    });
                }
            }

            // 对两种结果进行合并
            if( rdResult !== undefined ){
                result = Util.intersect( comResult, rdResult, function getValue( item ){
                    return item.index;
                });
            }
            else {

                result = comResult;
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

        //todo 还存在很多问题，还是应该是用运算符的定义方法来作为比较
        _queryRedundancyTable: function( key, operator, value ){

            var rule = TableItem.queryRules[ operator ];
            var data = this.get( 'data' );
            var useRedundancy = rule.useRedundancy;
            var rdTable = this.redundancyTable[ key ];
            var rdData = rdTable.get( 'data' );
            var rdLen = rdData.length;
            var index;
            var result = [];
            var originIndex;
            var i;

            if( useRedundancy ){

                // 从key对应的冗余数据表中查询数据
                originIndex = Util.binarySearch( rdData, value, function( item ){

                    return item[ 1 ];
                });


                switch( operator ){
                    // 若为 =
                    case '=':
                        index = rdData[ originIndex ][ 0 ];
                        result.push({
                            index: index,
                            data: data[ index ]
                        });
                        break;

                    // 若为 !=
                    case '!=':
                        for( i = 0; i < rdLen; i++ ){

                            if( rdData[ i ] !== undefined && i !== originIndex ){
                                index = rdData[ i ][ 0 ];
                                result.push({
                                    index: index,
                                    data: data[ index ]
                                });
                            }
                        }
                        break;

                    // 若为 >=
                    // 在此以及下方的比较都是，是默认冗余表是升序排列
                    case '>=':
                        for( i = originIndex; i < rdLen; i++ ){

                            if( rdData[ i ] !== undefined ){

                                index = rdData[ i ][ 0 ];
                                result.push({
                                    index: index,
                                    data: data[ index ]
                                });
                            }
                        }
                        break;

                    // 若为 <=
                    case '<=':
                        for( i = originIndex; i >= 0; i-- ){

                            if( rdData[ i ] !== undefined ){

                                index = rdData[ i ][ 0 ];
                                result.push({
                                    index: index,
                                    data: data[ index ]
                                });
                            }
                        }
                        break;

                    // 若为 >
                    case '>':
                        for( i = originIndex + 1; i < rdLen; i++ ){

                            if( rdData[ i ] !== undefined ){

                                index = rdData[ i ][ 0 ];
                                result.push({
                                    index: index,
                                    data: data[ index ]
                                });
                            }
                        }
                        break;

                    // 若为 <
                    case '<':
                        for( i = originIndex - 1; i >= 0; i-- ){

                            if( rdData[ i ] !== undefined ){

                                index = rdData[ i ][ 0 ];
                                result.push({
                                    index: index,
                                    data: data[ index ]
                                });
                            }
                        }
                        break;
                    default:
                        break;
                }
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
        _buildRedundancyTable: function( ){

            if( !this.redundancyTable ){

                this.redundancyTable = {};
            }

            var fields = this.get( 'index' );
            var dbName = this.get( 'dbName' );
            var tableName = this.get( 'name' );
            var rdTable;
            var data;
            var field;
            var index;
            var RedundancyTable = LocalStorage.redundancyTableItem;

            for( index = 0; field = fields[ index ]; index++ ){

//                data = this._buildRedundancyData( field );
                rdTable = this.redundancyTable[ field ] = new RedundancyTable( dbName, tableName, field );

                // 查看是否原来就有数据
                if( !rdTable.get( 'length' ) ){

                    data = this._buildRedundancyData( field );
                    rdTable.set( data );
                }
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

//        /**
//         * 获取到存储在localStorage中的数据
//         * 遍历表的所有字段，已经建立了冗余表的，则直接fetch，否则新建表，并fetch
//         * @private
//         */
//        _fetchRedundancyTable: function(){
//
//            var fields = this.get( 'fields' );
//            var dbName = this.get( 'dbName' );
//            var tableName = this.get( 'name' );
//            var RedundancyTable = LocalStorage.redundancyTableItem;
//            var field;
//            var index;
//            var rdTable;
//
//            if( !this.redundancyTable ){
//
//                this.redundancyTable = {};
//            }
//
//            for( index = 0; field = fields[ index ]; index++ ){
//
//                if( field in this.redundancyTable ){
//
//                    rdTable = this.redundancyTable[ field ];
//                    rdTable.fetch();
//                }
//                else {
//
//                    rdTable = this.redundancyTable[ field ] = new RedundancyTable( dbName, tableName, field );
//                    rdTable.fetch();
//
//                    // 当localStorage中没有数据时，fetch不会有任何影响，必须先将新建的空冗余表储存到localStorage中
//                    rdTable.save();
//                }
//            }
//        },

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
            var fieldHash = this.fieldHash;
            var value;

            for( field in this.redundancyTable ){

                rdTable = this.redundancyTable[ field ];
                value = data[ fieldHash[ field ] ];

                rdTable.insert( index, value );
            }
        },

        _updateRedundancyItem: function( index, updateObj ){

            var fieldHash = this.fieldHash;
            var field;
            var rdTable;
            var value;

            for( field in updateObj ){

                rdTable = this.redundancyTable[ field ];

                if( rdTable ){

                    value = updateObj[ field ];
                    rdTable.update( index, value );
                }
            }
        }
    });
})( window );