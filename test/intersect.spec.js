(function(){

    describe( 'intersect并集测试', function(){

        var Database = window[ 'Database' ];
        var Util = Database.util;

        it( '空集测试', function(){

            var dataA = [];
            var dataB = [ 2, 4, 7, 8, 9 ]

            var result = Util.intersect( dataA, dataB );

            expect( result.length).toBe( 0 );

            result = Util.intersect( dataB, dataA );

            expect( result.length).toBe( 0 );
        });

        it( '一般测试', function(){

            var dataA = [ 2, 7, 0, 11 ];
            var dataB = [ 2, 4, 7, 8, 9 ]

            var result = Util.intersect( dataA, dataB );

            expect( result.length ).toBe( 2 );
            expect( result[ 0 ] ).toBe( 0 );
            expect( result[ 1 ]).toBe( 1 );
        });
    });
})();