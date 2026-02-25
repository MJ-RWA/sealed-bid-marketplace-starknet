import "./ProposalForm.css"

function ProposalForm({value, onChange }) {
  return (
    <div class="proposal">
      <p>PROPOSAL</p>
      <textarea
        placeholder="Explain how you will complete this job..."
        rows="4"
        cols="40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default ProposalForm;
