(function(){

    describe( 'database操作测试', function(){

        var Helper = window[ 'Helper' ];
        var Database = window[ 'Database' ];
        var dbName = Helper.getDatabaseName();
        var tableName = Helper.getTableName();
        var fields = [ 'a', 'b', 'c' ];

        it( 'createDatabase添加数据库', function(){

            var db = Database.createDatabase( dbName );

            // 检查成员是否正常
            expect( db.get( 'name' )).toBe( dbName );
            expect( db.get( 'length' )).toBe( 0 );
            expect( db.get( 'tables' ).constructor).toEqual( Object );
        });

        it( 'openDatabase读取数据库', function(){

            var db = Database.openDatabase( dbName );

            expect( db.get( 'name' )).toBe( dbName );
            expect( db.get( 'length' )).toBe( 0 );
            expect( db.get( 'tables' ).constructor).toEqual( Object );
        });

        it( 'createTable创建表', function(){

            var db = Database.openDatabase( dbName );
            var t = db.createTable( tableName, fields );

            // 检查t的属性是否正常
            expect( t.get( 'name' )).toBe( tableName );
            expect( t.get( 'dbName' )).toBe( dbName );
            expect( t.get( 'length' )).toBe( 0 );
        });

        it( 'openTable打开表', function(){

            var db = Database.openDatabase( dbName );
            var t = db.openTable( tableName );

            // 检查t的属性是否正常
            expect( t.get( 'name' )).toBe( tableName );
            expect( t.get( 'dbName' )).toBe( dbName );
            expect( t.get( 'length' )).toBe( 0 );
        });
    });

})();