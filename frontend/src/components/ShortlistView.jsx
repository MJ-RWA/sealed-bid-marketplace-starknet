import React from "react";

function ShortlistView() {
  const mockBids = [
    { id: 1, price: 100, time: 5 },
    { id: 2, price: 120, time: 3 },
    { id: 3, price: 110, time: 4 },
  ];

  return (
    <div>
      <h3>Shortlisted Bids</h3>

      {mockBids.map((bid) => (
        <div key={bid.id}>
          <p>
            Price: ${bid.price} | Time: {bid.time} days
          </p>
          <button>Hire</button>
        </div>
      ))}
    </div>
  );
}

export default ShortlistView;
