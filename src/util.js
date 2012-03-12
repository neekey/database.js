(function( host ){

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
         * @return {Array} 以A中的数组成员作为结果返回
         * @return {Array}
         * //todo 对单元测试进行修改
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
            var ifGetValue = !!( typeof getValue === 'function' );

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

                if( ifGetValue && item !== undefined && item !== null ){

                    value = getValue( item );
                }
                else {

                    value = item;
                }

                value = Number( value );
                target = Number( target );

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
