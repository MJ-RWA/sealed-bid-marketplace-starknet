// real backend call logic


// export async function createJob(jobData) {
//   try {
//     const response = await fetch("http://localhost:5000/jobs", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(jobData),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to create job");
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Create Job Error:", error);
//     throw error;
//   }
// }


// reall backend logic for commiting Bids

// export async function commitBid(jobId, bidData) {
//   try {
//     const res = await fetch(`http://localhost:5000/jobs/${jobId}/bids`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(bidData),
//     });

//     if (!res.ok) throw new Error("Failed to commit bid");

//     const updatedJob = await res.json(); // backend should return updated job
//     return updatedJob;
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// }


async function handleReveal(bid) {
  try {
    const res = await fetch(`http://localhost:5000/jobs/${job.id}/bids/${bid.bidder}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: bid.amount }) // or any info needed
    });

    if (!res.ok) throw new Error("Reveal failed");

    const updatedJob = await res.json();
    onSubmitReveal(updatedJob); // pass to JobDetail → App.jsx
    alert("Bid revealed!");
  } catch (err) {
    console.error(err);
    alert("Reveal failed");
  }
}

async function handleShortlist() {
  try {
    const res = await fetch(
      `http://localhost:5000/jobs/${job.id}/shortlist`,
      { method: "POST" }
    );

    if (!res.ok) throw new Error("Shortlist failed");

    const updatedJob = await res.json();

    //  Update global jobs state
    onSubmitReveal(updatedJob);

  } catch (err) {
    console.error(err);
  }
}





export async function createJob(jobData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now(),
        ...jobData,
        // budget: "1000 - 5000 STRK",
        // description: "New job created locally",
        // deadline: "2 days left"
      });
    }, 500);
  });
}