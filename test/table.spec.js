(function(){

    //todo 深入对query sort等api的测试
    describe( 'table表相关操作测试', function(){

        var Helper = window[ 'Helper' ];
        var Database = window[ 'Database' ];
        var dbName = Helper.getDatabaseName();
        var tableName = Helper.getTableName();
        var fields = [ 'a', 'b', 'c', 'type' ];

        var db = Database.createDatabase( dbName );
        var t = db.createTable( tableName, fields );

        it( 'insert', function(){

            var result;
            var newItemNum;
            var newItemObj;
            var index;
            var resultItem;

            // 数字形式
            runs(function(){

                jasmine.log( '以数组的形式插入数据---------' );
                newItemNum = [ 1, 2, 3 ];
                t.insert( newItemNum );

                result = t.query();

                resultItem = result[ 0 ];

                expect( resultItem ).not.toBe( undefined );

                for( index = 0; resultItem[ index ]; index++ ){

                    expect( newItemNum[ index ]).toEqual( resultItem[ index ] );
                }
            });

            runs(function(){

                jasmine.log( '以对象的形式插入数据---------');
                // 对象形式
                newItemObj = {
                    a: 2,
                    b: 3,
                    c: 4
                };
                t.insert( newItemObj );

                result = t.query();

                resultItem = result[ 1 ];

                expect( resultItem ).not.toBe( undefined );

                for( index = 0; fields[ index ]; index++ ){

                    expect( newItemObj[ fields[ index ] ]).toEqual( resultItem[ index ] );
                }
            });


            runs(function(){

                // 重新读取表 查看数据是否正常
                t = db.openTable( tableName );
                result = t.query();

                for( index = 0; fields[ index ]; index++ ){

                    expect( newItemNum[ index ]).toEqual( result[ 0 ][ index ] );
                    expect( newItemObj[ fields[ index ] ]).toEqual( result[ 1 ][ index ] );
                }
            });

        });

//        it( 'Batch Insert', function(){
//
//            runs(function(){
//
//                jasmine.log( '批处理插入数组类型数据' );
//
//                var BatchData = [];
//                var index;
//
//                for( index = 0; index < 100; index++ ){
//
//                }
//
//            });
//        });

        it( 'update', function(){

            var index;
            var newItem = {
                a: 9,
                b: 10,
                c: 11,
                type: 'update'
            };
            var updateItem = {
                a: 11,
                b: 12,
                c: 13,
                type: 'update'
            };
            var result;

            t.insert( newItem );
            result = t.query( { type: '= update' } );

            // 验证是否插入成功
            for( index = 0; fields[ index ]; index++ ){

                expect( result[ 0 ][ index ]).toEqual( newItem[ fields[ index ] ] );
            }

            // 更新数据
            t.update( { type: '= update' }, updateItem );
            result = t.query( { type: '= update' } );

            // 重新打开table后 是否保存了更改
            for( index = 0; fields[ index ]; index++ ){

                expect( result[ 0 ][ index ]).toEqual( updateItem[ fields[ index ] ] );
            }


        });

        it( 'remove', function(){

            // 先创建一个
            var index;
            var result;
            var resultItem;
            var newItem = [ 9, 10, 11, 'remove' ];

            t.insert( newItem );
            result = t.query( { type: '= remove' } );
            resultItem = result[ 0 ];

            expect( typeof resultItem ).not.toBe( undefined );
            expect( result.length).toBe( 1 );

            for( index = 0; newItem[ index ]; index++ ){

                expect( newItem[ index ]).toEqual( newItem[ index ] );
            }

            // 删除
            t.remove({ type: '= remove' });

            // 再次查询
            result = t.query( { type: '= remove' } );

            expect( result.length).toBe( 0 );
        });

        it( 'Batch Insert', function(){

            runs(function(){

                jasmine.log( '构造数据' );
                var Data = [];
                var tableData;
                var timeCount = (new Date()).valueOf();
                var i;
                var originLen = t.get( 'length' );
                var newLen;
                var result;
                var endIndex;

                for( index = 100; index < 1000; index++ ){

                    Data.push( [ index ] );
                }

                result = t.insert( Data, true );
                endIndex = result.index;

                jasmine.log( '插入900行数据耗时:' + ( (new Date()).valueOf() - timeCount ) / 1000 + 's' );

                newLen = t.get( 'length' );
                expect( newLen ).toBe( originLen + 900 );

                tableData = t.get( 'data' );

                for( index = endIndex - 900 + 1, i = 100; index <= endIndex; index++, i++ ){

                    expect( tableData[ index ]).toBe( i );
                }

            });
        });

        it( 'query', function(){

            var strData = [];
            var strTarget;
            var result;
            var resultItem;
            var index;

            runs( function(){
                jasmine.log( '测试 = 操作符' );

                result = t.query( { a: '= 550' } );
                resultItem = result[ 0 ];

                expect( typeof resultItem ).not.toBe( undefined );
                expect( result.length).toBe( 1 );
                expect( resultItem[ 0 ]).toBe( 550 );
            });

            runs(function(){
                jasmine.log( '测试 > 操作符' );

                result = t.query( { a: '> 550' } );

                expect( result.length).toBe( 449 );
                for( index = 0; result[ index ] !== undefined; index++ ){

                    expect( result[ index ] > 550 ).toBe( true );
                }
            });

            runs(function(){
                jasmine.log( '测试 >= 550' );

                result = t.query( { a: '>= 550' } );

                expect( result.length ).toBe( 450 );
                for( index = 0; result[ index ] !== undefined; index++ ){

                    expect( result[ index ] >= 550 ).toBe( true );
                }
            });

            runs(function(){
                jasmine.log( '测试 < 操作符 同时 >= 100' );

                result = t.query( { a: '< 550; >= 100' } );

                expect( result.length ).toBe( 450 );
                for( index = 0; result[ index ] !== undefined; index++ ){

                    expect( result[ index ] < 550 ).toBe( true );
                }
            });

            runs(function(){
                jasmine.log( '测试 <= 操作符 同时 >= 100' );

                result = t.query( { a: '<= 550; >= 100' } );

                expect( result.length).toBe( 451 );
                for( index = 0; result[ index ] !== undefined; index++ ){

                    expect( result[ index ] <= 550 ).toBe( true );
                }
            });

            runs(function(){

                jasmine.log( '构造字符串类数据' );
                strTarget = 'target';
                strData = [
                    [ 'noresult', 'strTest' ],
                    [ strTarget + 'hahhaah', 'strTest' ],
                    [ 'hhahahaha' + strTarget, 'strTest' ],
                    [ 'hahaha' + strTarget + 'hahaha', 'strTest' ]
                ];


                for( index = 0; strData[ index ]; index++ ){

                    t.insert( strData[ index ] );
                }
            });

            runs(function(){

                jasmine.log( '不包含目标字符串' );

                result = t.query( { a: '!*= ' + strTarget, b: '= strTest' });

                expect( result.length).toBe( 1 );
                expect( result[ 0 ][ 0 ]).toEqual( strData[ 0 ][ 0 ] );
            });

            runs(function(){

                jasmine.log( '包含目标字符串' );

                result = t.query( { a: '*= ' + strTarget, b: '= strTest' } );

                expect( result.length).toBe( 3 );
            });

            runs(function(){

                jasmine.log( '以目标字符串开始' );

                result = t.query( { a: '^= ' + strTarget, b: '= strTest' } );

                expect( result.length ).toBe( 1 );
                expect( result[ 0 ][ 0 ] ).toEqual( strData[ 1 ][ 0 ] );
            });

            runs(function(){

                jasmine.log( '以目标字符串结尾' );

                result = t.query( { a: '$= ' + strTarget, b: '= strTest' } );

                expect( result.length ).toBe( 1 );
                expect( result[ 0 ][ 0 ] ).toEqual( strData[ 2 ][ 0 ] );
            });

            runs(function(){

                jasmine.log( '不以目标字符串开头' );

                result = t.query( { a: '!^= ' + strTarget, b: '= strTest' } );

                expect( result.length).toBe( 3 );
            });

            runs(function(){

                jasmine.log( '不以目标字符串结尾' );

                result = t.query( { a: '!$= ' + strTarget, b: '= strTest' } );

                expect( result.length).toBe( 3 );
            });

            runs(function(){

                jasmine.log( '即不以目标字符串结尾 也不以目标字符串开头 同时包含目标字符串' );

                result = t.query( { a: '!$= ' + strTarget + '; !^= ' + strTarget + '; *= ' + strTarget, b: '= strTest' } );

                expect( result.length ).toBe( 1 );
                expect( result[ 0 ][ 0 ] ).toEqual( strData[ 3 ][ 0 ] );
            });

            runs( function(){

                jasmine.log( '测试以对象的形式返回结果' );

                var data = [ 1, 2, 3, 'obj' ];
                var index;
                var item;
                var result;
                var field;

                t.insert( data );
                result = t.query({ type: '= obj'}, { type: 'object' } );
                item = result[ 0 ];

                for( index = 0; field = fields[ index ]; index++ ){

                    expect( item[ field ]).toEqual( data[ index ] );
                }
            });

        });
    });
})();