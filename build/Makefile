CLOSURE_URL = http://closure-compiler.googlecode.com/files/compiler-latest.zip
UTIL_DIR = util
LIB_DIR = ../lib

build:
	mkdir -p $(LIB_DIR)
	cat ../src/assert.js ../src/trace.js ../src/ast.js ../src/model.js > ../lib/model.js
	java -jar util/cc.jar --language_in ECMASCRIPT5 --compilation_level SIMPLE_OPTIMIZATIONS --js ../src/assert.js --js ../src/trace.js --js ../src/ast.js --js ../src/model.js --js_output_file ../lib/model.min.js

install-closure:
	mkdir -p $(UTIL_DIR)
	wget $(CLOSURE_URL) -O closure.zip
	unzip -o closure.zip compiler.jar
	mv compiler.jar util/cc.jar
	rm closure.zip
