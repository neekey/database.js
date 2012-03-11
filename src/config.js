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

})( window );