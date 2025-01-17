// Users can make POST request to /snippets to create a new snippet
// Users can make a GET request to /snippets to get all the snippets currently in the data store
// Users can make a GET request to e.g. /snippets/3 to retrieve the snippet with the ID of 3
// Bonus: Users can make a GET request to e.g. /snippets?lang=python to retrieve all the Python snippets

import express, { Request, Response } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const app = express();
const PORT = 3000;
const seedDataFilePath = './seedData.json';


const ENCRYPTION_KEY = crypto.scryptSync('my-secret-password', 'salt', 32);
const IV = Buffer.alloc(16, 0); 


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

const readSnippetsFromFile = (): any[] => {
  const data = fs.readFileSync(seedDataFilePath, 'utf8');
  return JSON.parse(data);

};

const saveSnippetToFile = (snippet: any) => {
  const snippets = readSnippetsFromFile();
  snippets.push(snippet);
  fs.writeFileSync(seedDataFilePath, JSON.stringify(snippets, null, 2), 'utf8');
};

// const saveToFile = (data: any[], filePath: string) => {
//   fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
//       console.log('Data successfully saved to file!');
//   });
// };

app.use(express.json());


app.get('/snippets', (req: Request, res: Response) => {
  const snippets = readSnippetsFromFile();
  const decryptedSnippets = snippets.map((snippet) => ({
    ...snippet,
    code: decrypt(snippet.code),
  }));
  res.json(decryptedSnippets);
});

app.get('/snippet', (req: Request, res: Response) => {
  const snippets = readSnippetsFromFile();
  res.json(snippets);
});

app.get('/snippets/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const snippets = readSnippetsFromFile();
  const snippet = snippets.find((snippet) => snippet.id === id);
  snippet.code = decrypt(snippet.code);
  res.json(snippet);
});



app.post('/snippets', (req: Request, res: Response): void => {
  const { language, code } = req.body;

  const snippets = readSnippetsFromFile();
  const newSnippet = {
    id: snippets.length ? snippets[snippets.length - 1].id + 1 : 1,
    language,
    code: encrypt(code),
  };

  saveSnippetToFile(newSnippet);
  res.status(201).json(newSnippet)
});

//User 

const userDataFilePath = './userData.json';

const readUserFromFile = (): any[] => {
  const data = fs.readFileSync(userDataFilePath, 'utf8');
  return JSON.parse(data);
};

const saveUserToFile = (user: any) => {
  const users = readUserFromFile();
  users.push(user);
  fs.writeFileSync(userDataFilePath, JSON.stringify(users, null, 2), 'utf8');
};

app.get('/users', (req: Request, res: Response) => {
  const users = readUserFromFile();
  res.json(users);
});

app.post('/users', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);


  const newUser = {
    email: email,
    password: hashedPassword,
  };

  saveUserToFile(newUser);
  res.status(201).json(newUser)
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

