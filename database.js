(function( host ){

    host[ 'Database' ] = {
        config: {},
        localStorage: {}
    };

})( window );
(function( host ){

    var Database = host.Database;

    Database.config = {
        name: {
            libraryName: 'DatabaseJS',
            databasePrefix: 'database',
            tablePrefix: 'table',
            redundancyTablePrefix: 'redundancyTable'
        }
    };

})( window );(function( host ){

    var Database = host[ 'Database' ];

    Database.util = {
        mix: function( t, s ){

            var key;

            for( key in s ){

                t[ key ] = s[ key ];
            }
        },

        uuid: function(){

            return (new Date).valueOf();
        },

        /**
         * 获取两个数组的并集
         * @param dataA
         * @param dataB
         * @param getValue
         * @return {Array} 以值在数组A中符合条件的成员作为结果返回
         * @return {Array}
         */
        intersect: function( dataA, dataB, getValue ){

            var indexA;
            var indexB;
            var itemA;
            var itemB;
            var valueA;
            var valueB;
            var ifGetValue = !!( typeof getValue === 'function' );
            var result = [];

            for( indexA = 0; itemA = dataA[ indexA ]; indexA++ ){

                if( ifGetValue ){

                    valueA = getValue( itemA );
                }
                else {

                    valueA = itemA;
                }

                for( indexB = 0; itemB = dataB[ indexB ]; indexB++ ){

                    if( ifGetValue ){

                        valueB = getValue( itemB );
                    }
                    else {

                        valueB = itemB;
                    }

                    if( valueA === valueB ){

                        result.push( itemA );
                    }
                }
            }

            return result;
        },

        /**
         * 二分查找
         * @param {Array} dataArr 数据数组( 数据中用于比较的值，需要从小到大排列）
         * @param {Number} target 查找目标
         * @param {Function} getValue( item )用于从每个item中获取比较不表值的方法，该方法必须return
         * @return {Number|undefined} 返回结果的索引值
         * @example
         *      var dataArr = [ { value: 1 }, { value: 2 } ];
         *      var getValue = function( item ){ return item.value; };
         *      var result = BinarySearch( dataArr, 2, getValue );
         * @constructor
         */
        binarySearch: function( dataArr, target, getValue ){

            var item;
            var value;
            var getValue = !!typeof getValue === 'function';

            var dataLen = dataArr.length;
            var max = dataLen - 1;
            var min = 0;
            var mid = Math.ceil( ( max + min ) / 2 );
            var queryCount = 0;
            var maxQuery = Math.ceil( Math.sqrt(dataLen ) );
            var result;

            while( true ){

                queryCount++;

                item = dataArr[ mid ];

                if( getValue ){

                    value = getValue( item );
                }
                else {

                    value = item;
                }

                if( value === target ){

                    result = mid;
                    break;
                }
                else if( value > target ){

                    max = mid - 1;
                }
                else if( value < target ){

                    min = mid + 1;
                }
                else {

                    break;
                }

                if( ( min > max ) || queryCount > maxQuery ){

                    break
                }

                mid = Math.ceil( ( max + min ) / 2 );
            }

            return result;
        },

        /**
         * 对数组进行排序
         * @param {Array} arr 需要进行排序的数组 注意，排序将修改数组本身
         * @param {String} type 排序类型 asc|desc
         * @param {Function} getValue 用于获取比较值的方法
         * @return {Array}
         */
        sort: function( arr, type, getValue ){

            arr.sort(function( a, b ){

                var valueA;
                var valueB;

                if( typeof getValue === 'function' ){

                    valueA = getValue( a );
                    valueB = getValue( b );
                }
                else {

                    valueA = a;
                    valueB = b;
                }

                switch( type.toLowerCase() ){

                    case 'asc':
                        return valueA - valueB;
                    case 'desc':
                        return valueB - valueA;
                }
            });

            return arr;
        }
    };

})( window );
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

})( window );(function( host ){

    var Database = host.Database;
    var Config = Database.config;
    var Util = Database.util;
    var LocalStorage = Database.localStorage;
    var Item = LocalStorage.item;
    var LS = localStorage;

    /**
     * 数据库对象
     * 若localStorage中已经包含名为name的数据库，则会自动fetch，否则会使用默认空数据
     * @type {Function}
     */
    var DatabaseItem = LocalStorage.databaseItem = function( name ){

        var key = DatabaseItem.getDatabaseKey( name );
        var defaultData = {
            name: name,
            length: 0,
            tables: {}
        };

        Item.call( this, key );

        // 检查原来是否有数据
        if( this.get( 'name' ) === undefined ){

            this.set( defaultData );
        }
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

//            // 建立冗余数据表
//            newTable._createRedundancyTable();
//            newTable.save();

            tables[ name ] = {
                name: name
            };

            this.set( { length: this.get( 'length' ) + 1 } );

            return newTable;
        },

        openTable: function( name ){

            var tables = this.get( 'tables' );

            if( !tables[ name ] ){

                return;
            }

            var newTable = new LocalStorage.tableItem( this.get( 'name' ), name );

//            newTable.fetch();

            // fetch冗余表数据
//            newTable._fetchRedundancyTable();

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
            }
        }
    });

    Util.mix( Database, {

        createDatabase: function( name ){

            if( DatabaseItem.ifDatabaseExist( name ) ){

                return;
            }

            var newDB = new DatabaseItem ( name );

            return newDB;
        },

        openDatabase: function( name ){

            if( !DatabaseItem.ifDatabaseExist( name ) ){

                return;
            }

            var newDB = new DatabaseItem ( name );

            return newDB;
        }
    });
})( window );(function( host ){

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