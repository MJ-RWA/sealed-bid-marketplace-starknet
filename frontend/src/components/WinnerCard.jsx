function WinnerCard({ winner }) {
  if (!winner) return null;

  return (
    <div>
      <h3>Winner Selected</h3>
      <p>Price: ${winner.price}</p>
      <p>Time: {winner.time} days</p>
    </div>
  );
}

export default WinnerCard;
