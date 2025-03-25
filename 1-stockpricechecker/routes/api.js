'use strict';

const axios = require('axios');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto'); // Import crypto for hashing

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const stockSchema = new Schema({
  stock: String,
  likes: { type: Number, default: 0 },
  hashedIps: [String] // Store hashed IPs to prevent duplicate likes
});

const Stock = mongoose.model('Stock', stockSchema);

// Function to hash an IP address
const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip).digest('hex');
};

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const { stock, like } = req.query;
        const stocks = Array.isArray(stock) ? stock : [stock];

        if (stocks.length > 2) {
          return res.status(400).json({ error: 'Only one or two stocks can be compared' });
        }

        let stockResults = await Promise.all(stocks.map(async (symbol) => {
          const stockData = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          let price = stockData.data.latestPrice;
          
          let stockRecord = await Stock.findOne({ stock: symbol });

          if (!stockRecord) {
            stockRecord = new Stock({ stock: symbol });
            await stockRecord.save();
          }

          if (like === 'true') {
            const hashedIp = hashIP(req.ip); // Hash the user's IP before checking storage

            if (!stockRecord.hashedIps.includes(hashedIp)) {
              stockRecord.likes += 1;
              stockRecord.hashedIps.push(hashedIp);
              await stockRecord.save();
            }
          }

          return { stock: symbol, price, likes: stockRecord.likes };
        }));

        // If two stocks are requested, calculate relative likes
        if (stockResults.length === 2) {
          const rel_likes_1 = stockResults[0].likes - stockResults[1].likes;
          const rel_likes_2 = stockResults[1].likes - stockResults[0].likes;

          return res.json({
            stockData: [
              { stock: stockResults[0].stock, price: stockResults[0].price, rel_likes: rel_likes_1 },
              { stock: stockResults[1].stock, price: stockResults[1].price, rel_likes: rel_likes_2 }
            ]
          });
        }

        // If only one stock is requested
        return res.json({
          stockData: stockResults[0]
        });

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
};
