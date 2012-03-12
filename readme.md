##Database.js  
**-version 1.0.0**

一个简单的基于`localStorage`的前端数据库

###API

####创建数据库

`var db = Database.createDatabase( 'myDB' );`

####打开已经创建的数据库

`var db = Database.openDatabase( 'myDB' );`

####创建表

`var t = db.createTable( 'myTable', [ 'name', 'age', 'sex' ] );`

####打开已经创建的表

`var t = db.openTable( 'myTable' );`

####删除表

`db.removeTable( 'myTable' );`

####表相关操作

#####插入 insert

`t.insert([ 'neekey', '22', 'male' ]);` 或者 

`t.insert({
	name: 'neekey',
	age: 22,
	male: 'male'
});`

#####查询 query

**普通查询**

`var result = t.query({ 'age': '= 22' });
// result -> [ 'neekey', 22, 'male' ]`

**多个条件**

`var result = t.query({ 'age': '> 10; < 20', sex: '= male' });
// result -> [ 'neekey', 22, 'male' ]`

**对结果进行排序**

	t.insert( [ 'john', 35, 'male' ] );
	t.insert( [ 'katy', 15, 'female' ] );
	
	var result = t.query({}, 'asc age' );
	// result -> [ [ 'katy', 15, 'female' ], [ 'neekey', 22, 'male' ], [ 'john', 35, 'male' ] ]
	
**目前支持的查询**

* `=`: 等于
* `!=`: 不等于
* `>`: 大于
* `>=`: 大于等于
* `<`: 小于
* `<=`: 小于等于
* `*=`: 包含
* `!*=`: 不包含
* `^=`: 以目标字符串开头
* `!^=`: 不以目标字符串开头
* `$=`: 以目标字符串结尾
* `!$=`: 不以目标字符串结尾

####更新 update

`t.update( { name: '= neekey' }, { age: 23 });`

####删除 remove

`t.remove( { name: '= neekey' } );`



