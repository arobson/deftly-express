require( "../setup" );
var deftly = require( "deftly" );
var moment = require( "moment" );

describe( "Deftly Service", function() {
	var service;
	before( function() {
		return deftly.init( {
			middleware: [ "./spec/extensions/middleware/*.js" ],
			plugins: [ "./spec/extensions/plugins/*.js" ],
			resources: [ "./spec/extensions/resources/*-resource.js" ],
			transports: [ "./src/index.js" ],
			http: {
				configure: function( state ) {
					state.express.use( "/", function( req, res, next ) {
						res.set( "x-lol", "roflcoptor" );
						next();
					} );
					return when();
				}
			}
		} )
		.then( function( svc ) {
			service = svc;
			svc.start();
		} );
	} );

	describe( "when retrieving file", function() {
		var fileContent, headers;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/file", 
				{}, 
				function( err, resp, body ) {
					if( !err ) {
						fileContent = body;
					}
					headers = resp.headers;
					done();
				} );
		} );

		it( "should retrieve file contents with correct headers", function() {
			var verify = fs.readFileSync( "./spec/public/test.html" ).toString( "utf8" );
			fileContent.should.eql( verify );
		} );

		it( "should include expected headers", function() {
			headers[ "content-disposition" ].should.eql( 'attachment; filename="test.html"' );
			headers.should.have.property( "cache-control" );
			headers.should.have.property( "last-modified" );
			headers.should.have.property( "etag" );
			headers.should.have.property( "x-lol" );
		} );
	} );

	describe( "when retrieving stream as a file", function() {
		var fileContent, headers;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/fileStream", 
				{}, 
				function( err, resp, body ) {
					if( !err ) {
						fileContent = body;
					}
					headers = resp.headers;
					done();
				} );
		} );

		it( "should retrieve file contents with correct headers", function() {
			var verify = fs.readFileSync( "./spec/public/test.html" ).toString( "utf8" );
			fileContent.should.eql( verify );
		} );

		it( "should include expected headers", function() {
			headers[ "content-disposition" ].should.eql( 'inline; filename="stream.html"' );
			headers.should.have.property( "cache-control" );
			headers.should.have.property( "last-modified" );
			headers.should.have.property( "x-lol" );
		} );
	} );

	describe( "when calling an endpoint with a custom error", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/oops", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and error message", function() {
			status.should.equal( 400 );
			body.should.eql( "No one likes you." );
		} );
	} );

	describe( "when calling an endpoint with a fallback error", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/defaultError", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and error message", function() {
			status.should.equal( 500 );
			body.should.eql( "This is a default error because I poo'd" );
		} );
	} );

	describe( "when calling an endpoint with no custom error", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/serverError", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and error message", function() {
			status.should.equal( 500 );
			body.should.eql( "An unhandled error of 'UhohError' occurred at test - serverError" );
		} );
	} );

	describe( "when hitting simple endpoint", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/simple", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and response body", function() {
			status.should.equal( 200 );
			body.should.eql( "so simple" );
		} );
	} );

	describe( "when calling a forwarded action", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/proxy", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and response body", function() {
			status.should.equal( 200 );
			body.should.eql( "so simple" );
		} );
	} );

	describe( "when calling a redirected action", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/not/the/droids", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and response body", function() {
			status.should.equal( 200 );
			body.should.eql( "so simple" );
		} );
	} );

	describe( "when getting cookies", function() {
		var body, status, cookies;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/cookies", 
				{}, 
				function( err, resp, respBody ) {
					body = respBody;
					status = resp.statusCode;
					cookies = resp.headers[ "set-cookie" ];
					done();
				} );
		} );

		it( "should get correct status code and response body", function() {
			status.should.equal( 200 );
			body.should.eql( "cookie monster" );
			var utc = new moment().add( 6, "seconds" ).toDate().toUTCString();
			cookies.should.eql( [ `chocolate=chip; Max-Age=6; Path=/test/meta; Expires=${utc}` ] );
		} );
	} );

	describe( "when getting headers back", function() {
		var body, status;
		before( function( done ) {
			request.get( 
				"http://localhost:8800/test/meta", 
				{
					headers: {
						one: 1,
						two: "b",
						three: "a; b; c"
					}
				}, 
				function( err, resp, respBody ) {
					body = JSON.parse( respBody );
					status = resp.statusCode;
					done();
				} );
		} );

		it( "should get correct status code and response body", function() {
			status.should.equal( 200 );
			body.should.eql( {
				one: "1",
				two: "b",
				three: "a; b; c",
				host: "localhost:8800",
				connection: "close"
			} );
		} );
	} );

	after( function() {
		service.stop();
	} );
} );