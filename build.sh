#google_closure_compiler_jar="/users/neekey/google_closure_compiler/compiler.jar"

#java -jar ${google_closure_compiler_jar} --compilation_level=ADVANCED_OPTIMIZATIONS --js=src/namespace.js --js=src/util.js --js=src/localstorage.item.js --js=src/database.js --js_output_file=database.build.js
cat src/namespace.js src/util.js src/localstorage.item.js src/database.js src/table.js > database.build.js