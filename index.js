const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const data = require('./data.json');

const app = express();
const port = 5000;

// Updated CORS configuration
app.use(cors({
  origin: 'https://radiant-capybara-2c8b8c.netlify.app/',  
  optionsSuccessStatus: 200  
}));

// Handling OPTIONS requests for preflight (CORS)
app.options('*', (req, res) => {
  console.log('Preflight request received');
  res.status(200).send();
});

app.use(bodyParser.json());

function findBestMatch(question) {
  let bestMatch = null;
  let highestScore = 0;

  for (const [cdp, cdpData] of Object.entries(data)) {
    for (const [key, value] of Object.entries(cdpData)) {
      for (const variant of value.question_variants) {
        const score = similarity(question.toLowerCase(), variant.toLowerCase());
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { cdp, key, answer: value.answer, score };
        }
      }
    }
  }

  return bestMatch;
}

function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

app.get("/", (req, res) => {
  res.json({ message: "hiiiiii" });
});

app.post('/chat', (req, res) => {
  const userQuestion = req.body.question;
  if (!userQuestion) {
    return res.status(400).send({ message: 'No question provided' });
  }

  const result = findBestMatch(userQuestion);
  if (result && result.score > 0.6) {
    res.send({
      answer: result.answer,
      cdp: result.cdp,
      key: result.key,
      score: result.score
    });
  } else {
    res.send({
      answer: "I'm sorry, I couldn't find a good match for your question. Could you please rephrase or ask about a different topic?",
      cdp: null,
      key: null,
      score: null
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
