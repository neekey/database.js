(function(){

    var helper = window[ 'Helper' ] = {

        getDatabaseName: function(){

            var name = 'database_test' + (new Date()).valueOf() + Math.random();
            return name;
        },

        getTableName: function(){

            return 'table_test' + (new Date()).valueOf() + Math.random();
        }
    };
})();