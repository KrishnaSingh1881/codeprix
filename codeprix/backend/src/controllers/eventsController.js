// Placeholder — replace with real DB queries later
const events = [
  { id: 1, name: 'CodePrix Opening Race', date: '2025-09-01', location: 'Monaco' },
  { id: 2, name: 'Hackathon Grand Prix', date: '2025-09-02', location: 'Monaco' },
];

exports.getEvents = (req, res) => {
  res.json({ success: true, data: events });
};
