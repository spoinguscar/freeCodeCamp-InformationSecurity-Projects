'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const express = require('express');
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const replySchema = new Schema({
  text: String,
  delete_password: String,
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now }
});

const threadSchema = new Schema({
  text: String,
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: String,
  replies: [replySchema], // Embed replies inside the thread
  replycount: { type: Number, default: 0 }, // Track the number of replies
  board: String
});

const Thread = mongoose.model('Thread', threadSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

module.exports = function (app) {
  
  // Create a new thread
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const newThread = new Thread({
        text,
        delete_password,
        board: req.params.board
      });
      await newThread.save();
      res.redirect(`/b/${req.params.board}/`);
    })
    .get(async (req, res) => {
      const threads = await Thread.find({ board: req.params.board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-delete_password -reported')
        .lean();

      threads.forEach(thread => {
        thread.replies = thread.replies
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }));
      });

      res.json(threads);
    })
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread || thread.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    })
    .put(async (req, res) => {
      await Thread.findByIdAndUpdate(req.body.thread_id, { reported: true });
      res.send('reported');
    });

  // Handle replies
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      thread.replies.push({ text, delete_password });
      thread.bumped_on = new Date();
      thread.replycount += 1; // Increase reply count
      await thread.save();
      res.redirect(`/b/${req.params.board}/${thread_id}`);
    })
    .get(async (req, res) => {
      const thread = await Thread.findById(req.query.thread_id)
        .select('-delete_password -reported')
        .lean();
      if (!thread) return res.status(404).send('Thread not found');

      thread.replies = thread.replies.map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on
      }));

      res.json(thread);
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply || reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      reply.text = '[deleted]';
      if (thread.replycount > 0) thread.replycount -= 1; // Decrease reply count but not below zero
      await thread.save();
      res.send('success');
    })
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.status(404).send('Reply not found');

      reply.reported = true;
      await thread.save();
      res.send('reported');
    });
};