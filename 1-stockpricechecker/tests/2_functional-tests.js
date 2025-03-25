const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
    let likesBefore;
    
    test('Viewing one stock: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices?stock=goog')
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isObject(res.body.stockData);
                assert.property(res.body.stockData, 'stock');
                assert.property(res.body.stockData, 'price');
                assert.property(res.body.stockData, 'likes');
                done();
            });
    });

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices?stock=goog&like=true')
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isObject(res.body.stockData);
                assert.property(res.body.stockData, 'likes');
                assert.isNumber(res.body.stockData.likes);
                likesBefore = res.body.stockData.likes;
                done();
            });
    });

    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices?stock=goog&like=true')
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isObject(res.body.stockData);
                assert.property(res.body.stockData, 'likes');
                assert.isNumber(res.body.stockData.likes);
                assert.equal(res.body.stockData.likes, likesBefore, 'Like count should not increase for the same IP');
                done();
            });
    });

    test('Viewing two stocks: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices?stock=goog&stock=aapl')
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isArray(res.body.stockData);
                assert.lengthOf(res.body.stockData, 2);
                assert.property(res.body.stockData[0], 'stock');
                assert.property(res.body.stockData[0], 'price');
                assert.property(res.body.stockData[0], 'rel_likes');
                assert.property(res.body.stockData[1], 'stock');
                assert.property(res.body.stockData[1], 'price');
                assert.property(res.body.stockData[1], 'rel_likes');
                done();
            });
    });

    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices?stock=goog&stock=aapl&like=true')
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isArray(res.body.stockData);
                assert.lengthOf(res.body.stockData, 2);
                assert.property(res.body.stockData[0], 'rel_likes');
                assert.property(res.body.stockData[1], 'rel_likes');
                assert.isNumber(res.body.stockData[0].rel_likes);
                assert.isNumber(res.body.stockData[1].rel_likes);
                assert.equal(-res.body.stockData[0].rel_likes, res.body.stockData[1].rel_likes, "Relative Likes should be inverses.")
                done();
            });
    });
});
