(function(){

    describe( '冗余表操作单元测试', function(){

        var Helper = window[ 'Helper' ];
        var Database = window[ 'Database' ];
        var dbName = Helper.getDatabaseName();
        var tableName = Helper.getTableName();
        var fields = [ 'a', 'b', 'c' ];

        var db = Database.createDatabase( dbName );
        var t = db.createTable( tableName, fields, fields );

        it( '创建数据', function(){

            var data = [];
            var mainData;
            var item;
            var field;
            var fieldHash = t.fieldHash;
            var rdIndexHash;
            var rdTable;
            var dataLen = 50;
            var rdData;
            var rdDataItem;
            var i;

            runs(function(){

                jasmine.log( '创建数据' );
                for( i = 0; i < dataLen; i++ ){

                    item = [ i, dataLen - i, dataLen + i ];
                    data.push( item );

                    t.insert( item );
                }
            });

            runs(function(){

                jasmine.log( '验证数据' );

                mainData = t.get( 'data' );

                for( field in fieldHash ){

                    rdTable = t.redundancyTable[ field ];
                    rdData = rdTable.get( 'data' );
                    rdIndexHash = rdTable.get( 'indexHash' );

                    expect( rdTable.get( 'length' )).toBe( dataLen );

                    for( i = 0; i < dataLen; i++ ){

                        rdDataItem = rdData[ rdIndexHash[ i ] ];
                        expect( rdDataItem[ 0 ] ).toBe( i );
                        expect( rdDataItem[ 1 ]).toEqual( mainData[ i ][ fieldHash[ field ] ] );
                    }
                }
            });


        });

        it( '删除数据', function(){

            var data = [];
            var mainData;
            var item;
            var field;
            var fieldHash = t.fieldHash;
            var rdIndexHash;
            var rdTable;
            var dataLen = 50;
            var rdData;
            var rdDataItem;
            var i;

            runs(function(){

                jasmine.log( '删除' );

                t.remove({ a: '= 44' });

            });

            runs(function(){

                jasmine.log( '验证' );

                mainData = t.get( 'data' );

                for( field in fieldHash ){

                    rdTable = t.redundancyTable[ field ];
                    rdData = rdTable.get( 'data' );
                    rdIndexHash = rdTable.get( 'indexHash' );

                    expect( rdTable.get( 'length' )).toBe( t.get( 'length') );

                    for( i = 0; i < dataLen; i++ ){

                        rdDataItem = rdData[ rdIndexHash[ i ] ];

                        if( rdDataItem === undefined ){

                            expect( mainData[ i ] ).toBe( undefined );
                        }
                        else {
                            expect( rdDataItem[ 0 ] ).toBe( i );
                            expect( rdDataItem[ 1 ] ).toEqual( mainData[ i ][ fieldHash[ field ] ] );
                        }

                    }
                }
            });

        });

        it( '修改', function(){

            var newData = {
                a: 1000,
                b: 0,
                c: 50
            };
            var updateIndex = 40;
            var resutl;

            var data = [];
            var mainData;
            var item;
            var field;
            var fieldHash = t.fieldHash;
            var rdIndexHash;
            var rdTable;
            var dataLen = 50;
            var rdData;
            var rdDataItem;
            var i;

            runs(function(){

                jasmine.log( '修改数据' );

                t.update({ a: '= ' + ( updateIndex - 1 ) }, newData );

            });

            runs(function(){

                jasmine.log( '验证数据' );

                mainData = t.get( 'data' );

                for( field in fieldHash ){

                    rdTable = t.redundancyTable[ field ];
                    rdData = rdTable.get( 'data' );
                    rdIndexHash = rdTable.get( 'indexHash' );

                    expect( rdTable.get( 'length' )).toBe( t.get( 'length') );

                    for( i = 0; i < dataLen; i++ ){

                        rdDataItem = rdData[ rdIndexHash[ i ] ];

                        if( rdDataItem === undefined ){

                            expect( mainData[ i ] ).toBe( undefined );
                        }
                        else {
                            expect( rdDataItem[ 0 ] ).toBe( i );
                            expect( rdDataItem[ 1 ] ).toEqual( mainData[ i ][ fieldHash[ field ] ] );
                        }
                    }
                }
            });
        });
    });
})();