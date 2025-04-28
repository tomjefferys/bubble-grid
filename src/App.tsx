import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Bubbles from './components/bubbles'

const wordSource = [
  "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew",
  "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry",
  "strawberry", "tangerine", "ugli", "vanilla", "watermelon", "xigua", "yam", "zucchini",
  "apricot", "blackberry", "blueberry", "cantaloupe", "coconut", "cranberry", "currant",
  "dragonfruit", "gooseberry", "grapefruit", "guava", "jackfruit", "kumquat", "lime",
  "lychee", "mandarin", "mulberry", "olive", "passionfruit", "peach", "pear", "persimmon",
  "pineapple", "plum", "pomegranate", "starfruit", "tamarind",
  "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew",
  "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry",
  "strawberry", "tangerine", "ugli", "vanilla", "watermelon", "xigua", "yam", "zucchini",
  "apricot", "blackberry", "blueberry", "cantaloupe", "coconut", "cranberry", "currant",
  "dragonfruit", "gooseberry", "grapefruit", "guava", "jackfruit", "kumquat", "lime",
  "lychee", "mandarin", "mulberry", "olive", "passionfruit", "peach", "pear", "persimmon",
  "pineapple", "plum", "pomegranate", "starfruit", "tamarind"
];

// Function to generate a list of random dictionary words
const generateRandomDictionaryWords = (numWords: number) => {
  const words = [];
  for (let i = 0; i < numWords; i++) {
    const index = i % wordSource.length;
    words.push(wordSource[index]);
  }
  return words;
};

const randomWords = generateRandomDictionaryWords(200); // Generate 100 random dictionary words


function App() {
  const [words, setWords] = useState<string[]>([]);

  const content = randomWords.map((word, index) => (
    <div key={index} 
        onClick={() => {
          setWords([...words, word])
        }}>
          {word}
    </div>
  ));

  return (
    <>
      <main>
       <div>
            {words.map((word, index) => (<span key={index}>{word} </span>))}
       </div>
       <Bubbles content={content}/>
       </main>
    </>
  )
}

export default App
