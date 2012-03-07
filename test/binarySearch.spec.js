(function(){

    describe( '二分查找', function(){

        var Database = window[ 'Database' ];
        var Util = Database.util;

        it( '测试', function(){

            var testData = caseFactory( 100 );
            var index;
            var data;
            var item;
            var targetType;
            var targetItem;
            var target;
            var targetResult;
            var result;

            for( index = 0; item = testData[ index ]; index++ ){

                data = item.data;

                jasmine.log( '测试组：: ' + index  + ' ---------------' );
                jasmine.log( '元数据:' );
                jasmine.log( data );

                for( targetType in item.target ){


                    targetItem = item.target[ targetType ];
                    target = targetItem.value;
                    targetResult = targetItem.result;

                    result = Util.binarySearch( data, target );
                    //result = targetResult;
                    jasmine.log( 'target类型： ' + targetType );
                    jasmine.log( targetItem );
                    jasmine.log( 'result: ' + result );

                    expect( result ).toBe( targetResult );
                }
            }
        });
    });

    function caseFactory( maxLen ){

        var minLen = 0;
        var target;
        var result = [];
        var offset = 10;
        var index;
        var targetMin;
        var targetMax;
        var targetMid1;
        var targetMid2;
        var data;
        var i;

        for( index = minLen; index < maxLen; index++ ){

            targetMin = minLen;
            targetMax = index;
            targetMid1 = parseInt( Math.random() * index );
            targetMid2 = parseInt( Math.random() * index );
            data = [];

            for( i = minLen; i <= index; i++ ){

                data.push( i );
            }

            result.push({
                data: data,
                target: {
                    min: {
                        value: targetMin,
                        result: 0
                    },
                    mid1: {
                        value: targetMid1,
                        result: targetMid1
                    },
                    mid2: {
                        value: targetMid2,
                        result: targetMid2
                    },
                    max: {
                        value: targetMax,
                        result: targetMax
                    },
                    outerMax: {
                        value: targetMax + offset,
                        result: undefined
                    },
                    outerMin: {
                        value: targetMin - offset,
                        result: undefined
                    }
                }
            });
        }

        return result;
    }
})();