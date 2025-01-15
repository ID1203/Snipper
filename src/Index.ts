// Users can make POST request to /snippets to create a new snippet
// Users can make a GET request to /snippets to get all the snippets currently in the data store
// Users can make a GET request to e.g. /snippets/3 to retrieve the snippet with the ID of 3
// Bonus: Users can make a GET request to e.g. /snippets?lang=python to retrieve all the Python snippets

import express, { Request, Response } from 'express';
import fs from 'fs';

const app = express();
const PORT = 3000;

let snippets: any[] = [];

fs.readFile('./seedData.json', 'utf8', (err, data) => {
  const seedData = JSON.parse(data);
  snippets.push(...seedData);
});

// Middleware to parse JSON request bodies
app.use(express.json());

app.get('/snippets', (req: Request, res: Response) => {
    res.json(snippets);
});

app.get('/snippets/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  const snippet = snippets.find((snippet) => snippet.id === id);
  res.json(snippet);
});

app.post('/snippets', (req: Request, res: Response) : void => {

  const newSnippet = req.body;
  newSnippet.id = snippets.length ? snippets[snippets.length - 1].id + 1 : 1

  snippets.push(newSnippet);
  res.status(201).json(newSnippet);
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
