import React, { useState, useEffect, useCallback } from "react";
import "./OrderbookHeatmap.css"; 

const OrderbookHeatmap = () => {
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  const [groupSize, setGroupSize] = useState(0.15); // Default group size
  const [feedData, setFeedData] = useState([]); // Array to hold the feed data
  const [feedIndex, setFeedIndex] = useState(0); // Track the current index of feed data
  const [latestPrice, setLatestPrice] = useState(Number.MAX_VALUE); // Initialize to a very high value

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/filteredData.json"); 
      const data = await response.json();
      setFeedData(data);
    };

    fetchData();
  }, []);

  const roundPrice = (price, size) => Math.floor(price / size) * size;

  const aggregateAndGroupData = useCallback(
    (data) => {
      let bids = {}, asks = {};

      data.forEach((item) => {
        const roundedPrice = roundPrice(item.price, groupSize);
        const collection = item.side === "bid" ? bids : asks;
        if (!collection[roundedPrice]) {
          collection[roundedPrice] = { price: roundedPrice, amount: 0 };
        }
        collection[roundedPrice].amount += item.amount;

        // Update the latest price for asks
        if (item.side === "ask" && item.price < latestPrice) {
          setLatestPrice(item.price);
        }
      });

      const sortAggregateAndTotal = (obj, isAsk) => {
        const sorted = Object.values(obj).sort((a, b) =>
          isAsk ? a.price - b.price : b.price - a.price
        );

        let total = 0;
        const withTotals = isAsk ? sorted : sorted.reverse();
        withTotals.forEach((entry) => {
          total += entry.amount;
          entry.total = total;
        });

        return isAsk ? withTotals : withTotals.reverse();
      };

      setOrderbook({
        bids: sortAggregateAndTotal(bids, false),
        asks: sortAggregateAndTotal(asks, true),
      });
    },
    [groupSize, latestPrice]
  );

  useEffect(() => {
    const feedDataIncrementally = () => {
      if (feedData.length > 0) {
        const nextData = feedData.slice(0, feedIndex + 1);
        aggregateAndGroupData(nextData);
        setFeedIndex(feedIndex + 1 >= feedData.length ? 0 : feedIndex + 1);
      }
    };

    const intervalId = setInterval(feedDataIncrementally, 3); // Feed data every 3 milliseconds

    return () => clearInterval(intervalId);
  }, [feedData, feedIndex, aggregateAndGroupData, setFeedIndex]);

  const renderOrderRow = (order, index, isBid) => {
    const rowStyle = {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      margin: "2px 0",
      borderRadius: "4px",
      backgroundColor: isBid ? "#ccffcc" : "#ffcccc",
    };

    const textStyle = {
      color: "#333",
      fontWeight: "bold",
    };

    return (
      <li key={index} style={rowStyle}>
        <span style={textStyle}>Price: {order.price.toFixed(2)}</span>
        <span style={textStyle}>Size: {order.amount.toFixed(2)}</span>
        <span style={textStyle}>Total: {order.total.toFixed(2)}</span>
      </li>
    );
  };

  return (
    <div className="orderbook-heatmap">
      <div className="grouping-select">
        <label htmlFor="groupSize">Group Size:</label>
        <select id="groupSize" value={groupSize} onChange={(e) => setGroupSize(parseFloat(e.target.value))}>
          <option value={0.15}>0.15</option>
          <option value={0.25}>0.25</option>
          <option value={0.5}>0.5</option>
          <option value={1}>1</option>
          <option value={2.5}>2.5</option>
        </select>
      </div>
      <div className="asks">
        <h2>Asks</h2>
        <ul>{orderbook.asks.map((order, index) => renderOrderRow(order, index, false))}</ul>
      </div>
      {latestPrice !== Number.MAX_VALUE && (
        <div className="latest-price">
          <h2>Latest Price: {latestPrice.toFixed(2)}</h2>
        </div>
      )}
      <div className="bids">
        <ul>{orderbook.bids.map((order, index) => renderOrderRow(order, index, true))}</ul>
        <h2>Bids</h2>
      </div>
    </div>
  );
};

export default OrderbookHeatmap;
