(function(){

    describe( '数组排序测试', function(){

        var Database = window[ 'Database' ];
        var Util = Database.util;

        it( '升序-纯数值', function(){

            var arr = [ 1,9,7,4,0,2,8,4,7,5,6,2 ];
            var expectResult = [ 0, 1, 2, 2, 4, 4, 5, 6, 7, 7, 8, 9 ];
            var result;
            var index;

            result = Util.sort( arr, 'asc' );

            expect( expectResult.length).toEqual( result.length );

            for( index = 0; index < result.length; index++ ){

                expect( expectResult[ index ]).toEqual( result[ index ] );
            }
        });

        it( '升序-对象', function(){

            var arr = [ 1,9,7,4,0,2,8,4,7,5,6,2 ];
            var arrObj = [];
            var expectResult = [ 0, 1, 2, 2, 4, 4, 5, 6, 7, 7, 8, 9 ];
            var result;
            var index;

            for( index = 0; index < arr.length; index++ ){

                arrObj.push( {
                    value: arr[ index ]
                });
            }

            result = Util.sort( arrObj, 'asc', function( item ){

                return item.value;
            });

            jasmine.log( result );
            jasmine.log( expectResult );
            expect( expectResult.length).toEqual( result.length );

            for( index = 0; index < result.length; index++ ){

                expect( expectResult[ index ]).toEqual( result[ index ][ 'value' ] );
            }
        });

        it( '降序-纯数值', function(){

            var arr = [ 1,9,7,4,0,2,8,4,7,5,6,2 ];
            var expectResult = [ 9,8,7,7,6,5,4,4,2,2,1,0 ];
            var result;
            var index;

            result = Util.sort( arr, 'desc' );

            expect( expectResult.length).toEqual( result.length );

            for( index = 0; index < result.length; index++ ){

                expect( expectResult[ index ]).toEqual( result[ index ] );
            }
        });

        it( '降序-对象', function(){

            var arr = [ 1,9,7,4,0,2,8,4,7,5,6,2 ];
            var arrObj = [];
            var expectResult = [ 9,8,7,7,6,5,4,4,2,2,1,0 ];
            var result;
            var index;

            for( index = 0; index < arr.length; index++ ){

                arrObj.push( {
                    value: arr[ index ]
                });
            }

            result = Util.sort( arrObj, 'desc', function( item ){

                return item.value;
            });

            jasmine.log( result );
            jasmine.log( expectResult );
            expect( expectResult.length).toEqual( result.length );

            for( index = 0; index < result.length; index++ ){

                expect( expectResult[ index ]).toEqual( result[ index ][ 'value' ] );
            }
        });

        it( '升序降序-字符串', function(){

            var arr = [ 'abc', 'abd', 'ccc', 'aacccccc', 'zzzzzz', 'dddddd' ];
            var expectResult = [ 'aacccccc', 'abc', 'abd', 'ccc', 'dddddd', 'zzzzzz' ];
            var result = Util.sort( arr, 'asc' );
            var index;

            for( index = 0; expectResult[ index ]; index++ ){

                expect( result[ index ]).toBe( expectResult[ index ] );
            }

            result = Util.sort( arr, 'desc')

            for( index = expectResult.length - 1; index >= 0; index-- ){

                expect( result[ expectResult.length - 1 - index ]).toBe( expectResult[ index ] );
            }

        });
    });

})();