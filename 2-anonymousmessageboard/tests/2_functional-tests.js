const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let threadId;
  let replyId;
  const board = 'testboard';
  const deletePassword = 'testpassword';

  test('Creating a new thread: POST request to /api/threads/{board}', function (done) {
    chai.request(server)
      .post(`/api/threads/${board}`)
      .send({ text: 'Test thread', delete_password: deletePassword })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function (done) {
    chai.request(server)
      .get(`/api/threads/${board}`)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        threadId = res.body[0]._id;
        done();
      });
  });

  test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
    chai.request(server)
      .put(`/api/threads/${board}`)
      .send({ thread_id: threadId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
    chai.request(server)
      .post(`/api/replies/${board}`)
      .send({ text: 'Test reply', delete_password: deletePassword, thread_id: threadId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
    chai.request(server)
      .get(`/api/replies/${board}?thread_id=${threadId}`)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.replies);
        assert.isAtLeast(res.body.replies.length, 1);
        replyId = res.body.replies[0]._id;
        done();
      });
  });

  test('Reporting a reply: PUT request to /api/replies/{board}', function (done) {
    chai.request(server)
      .put(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Deleting a reply with incorrect password: DELETE request to /api/replies/{board}', function (done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrongpassword' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a reply with correct password: DELETE request to /api/replies/{board}', function (done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: deletePassword })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('Deleting a thread with incorrect password: DELETE request to /api/threads/{board}', function (done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({ thread_id: threadId, delete_password: 'wrongpassword' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a thread with correct password: DELETE request to /api/threads/{board}', function (done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({ thread_id: threadId, delete_password: deletePassword })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  
});
