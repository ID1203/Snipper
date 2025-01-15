// Users can make POST request to /snippets to create a new snippet
// Users can make a GET request to /snippets to get all the snippets currently in the data store
// Users can make a GET request to e.g. /snippets/3 to retrieve the snippet with the ID of 3
// Bonus: Users can make a GET request to e.g. /snippets?lang=python to retrieve all the Python snippets

import express, { Request, Response } from 'express';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
const PORT = 3000;

let snippets: any[] = [];

// Encryption Configuration - Use fixed key and IV for simplicity
const ENCRYPTION_KEY = crypto.scryptSync('my-secret-password', 'salt', 32); // Derive key from password
const IV = Buffer.alloc(16, 0); // Use a fixed IV (this can be improved, e.g., by storing IV with data)

// Encryption and Decryption Functions
function encrypt(text: string) {
  if (!text) {
    throw new Error('Cannot encrypt: Text is undefined or empty');
  }
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(text: string) {
  if (!text) {
    throw new Error('Cannot decrypt: Text is undefined or empty');
  }
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

fs.readFile('./seedData.json', 'utf8', (err, data) => {
    const seedData = JSON.parse(data);
    seedData.forEach((item: any) => {
      if (item.code) {
        // Encrypt the 'code' field instead of 'content'
        item.code = encrypt(item.code);
      } else {
        console.warn('Skipping item with missing code field:', item);
      }
    });
    snippets.push(...seedData);
});

app.use(express.json());


app.get('/snippets', (req: Request, res: Response) => {
  const decryptedSnippets = snippets.map((snippet) => ({
    ...snippet,
    code: decrypt(snippet.code),
  }));
  res.json(decryptedSnippets);
});


app.get('/snippets/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const snippet = snippets.find((snippet) => snippet.id === id);
    snippet.code = decrypt(snippet.code);  
    res.json(snippet);
});


app.post('/snippets', (req: Request, res: Response): void => {
  const newSnippet = req.body;
  newSnippet.id = snippets.length ? snippets[snippets.length - 1].id + 1 : 1;
  newSnippet.code = encrypt(newSnippet.code);
  snippets.push(newSnippet);
  res.status(201).json(newSnippet);

});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

