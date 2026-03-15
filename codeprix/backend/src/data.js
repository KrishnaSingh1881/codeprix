// ─── Dummy Data for CodePrix ───

const questions = [
  // Speed Coding
  {
    id: 1,
    category: 'Speed Coding',
    title: 'Reverse a Linked List',
    description: 'Given a singly linked list, reverse the list in-place and return the new head.',
    difficulty: 'Medium',
  },
  {
    id: 2,
    category: 'Speed Coding',
    title: 'Two Sum',
    description: 'Given an array of integers and a target sum, return indices of the two numbers that add up to the target.',
    difficulty: 'Easy',
  },
  {
    id: 3,
    category: 'Speed Coding',
    title: 'Merge Intervals',
    description: 'Given a collection of intervals, merge all overlapping intervals and return the result.',
    difficulty: 'Medium',
  },
  {
    id: 4,
    category: 'Speed Coding',
    title: 'Binary Search Tree Validator',
    description: 'Write a function that checks whether a given binary tree is a valid BST.',
    difficulty: 'Hard',
  },

  // Logical Reasoning
  {
    id: 5,
    category: 'Logical Reasoning',
    title: 'The Liar Puzzle',
    description: 'Three people make statements. Exactly one is lying. Who is it? A says "B is lying", B says "C is lying", C says "A and B are both lying".',
    difficulty: 'Medium',
  },
  {
    id: 6,
    category: 'Logical Reasoning',
    title: 'River Crossing',
    description: 'A farmer needs to cross a river with a wolf, a goat, and cabbage. He can only carry one at a time. The wolf eats the goat if left alone, and the goat eats the cabbage. How does he get all three across?',
    difficulty: 'Easy',
  },
  {
    id: 7,
    category: 'Logical Reasoning',
    title: 'Clock Angle',
    description: 'What is the angle between the hour and minute hands of a clock at 3:15?',
    difficulty: 'Easy',
  },
  {
    id: 8,
    category: 'Logical Reasoning',
    title: 'Weighing Problem',
    description: 'You have 8 balls. One is heavier. Using a balance scale, what is the minimum number of weighings needed to find it?',
    difficulty: 'Medium',
  },

  // Aptitude
  {
    id: 9,
    category: 'Aptitude',
    title: 'Train Speed',
    description: 'Two trains are moving towards each other at 60 km/h and 40 km/h. They are 200 km apart. How long until they meet?',
    difficulty: 'Easy',
  },
  {
    id: 10,
    category: 'Aptitude',
    title: 'Probability Dice',
    description: 'What is the probability of rolling a sum of 7 with two fair six-sided dice?',
    difficulty: 'Easy',
  },
  {
    id: 11,
    category: 'Aptitude',
    title: 'Pipe & Cistern',
    description: 'Pipe A fills a tank in 6 hours, Pipe B in 8 hours. If both pipes are opened, how long to fill the tank?',
    difficulty: 'Medium',
  },
  {
    id: 12,
    category: 'Aptitude',
    title: 'Percentage Profit',
    description: 'A merchant buys an item for ₹800 and sells it for ₹1000. What is the percentage profit?',
    difficulty: 'Easy',
  },

  // Fun / Creative
  {
    id: 13,
    category: 'Fun',
    title: 'Emoji Decoder',
    description: 'Decode the programming language from these emojis: ☕🏝️ (Hint: its a popular language that is an island).',
    difficulty: 'Easy',
  },
  {
    id: 14,
    category: 'Fun',
    title: 'Bug Hunt',
    description: 'Find the 3 intentional bugs in this 10-line Python snippet that calculates Fibonacci numbers.',
    difficulty: 'Medium',
  },
  {
    id: 15,
    category: 'Fun',
    title: 'Code Pictionary',
    description: 'Draw an algorithm using only shapes and arrows. Your team has 60 seconds to guess which sorting algorithm it is.',
    difficulty: 'Easy',
  },
  {
    id: 16,
    category: 'Fun',
    title: 'Reverse Engineering',
    description: 'Given only the output "42", guess the original one-line program. Multiple valid answers accepted!',
    difficulty: 'Hard',
  },
];

const teams = [
  { id: 1,  name: 'Red Bull Racing',    members: 4, score: 2850, solvedCount: 38, avgTime: '1m 42s' },
  { id: 2,  name: 'Scuderia Ferrari',   members: 4, score: 2720, solvedCount: 36, avgTime: '1m 48s' },
  { id: 3,  name: 'McLaren Coders',     members: 3, score: 2580, solvedCount: 35, avgTime: '1m 55s' },
  { id: 4,  name: 'Mercedes AMG Dev',   members: 4, score: 2410, solvedCount: 33, avgTime: '2m 03s' },
  { id: 5,  name: 'Alpine Algorithms',  members: 3, score: 2290, solvedCount: 31, avgTime: '2m 10s' },
  { id: 6,  name: 'Aston Martin Devs',  members: 4, score: 2150, solvedCount: 29, avgTime: '2m 18s' },
  { id: 7,  name: 'Williams Runtime',   members: 3, score: 1980, solvedCount: 27, avgTime: '2m 25s' },
  { id: 8,  name: 'Haas Hackers',       members: 4, score: 1820, solvedCount: 25, avgTime: '2m 33s' },
  { id: 9,  name: 'AlphaTauri Logic',   members: 3, score: 1700, solvedCount: 23, avgTime: '2m 40s' },
  { id: 10, name: 'Kick Sauber Nodes',  members: 4, score: 1550, solvedCount: 21, avgTime: '2m 50s' },
];

// leaderboard is just teams sorted by score descending
const leaderboard = [...teams]
  .sort((a, b) => b.score - a.score)
  .map((t, i) => ({ rank: i + 1, ...t }));

module.exports = { questions, teams, leaderboard };
