import { useState } from 'react'
import './App.css'
import Bubbles from './components/bubbles'
import * as Bubble from './components/bubbletypes'
import * as Rect from './util/rect'
import { Axial, HexMap } from './util/hex'

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
const getWords = (numWords: number) => {
  const words = [];
  for (let i = 0; i < numWords; i++) {
    const index = i % wordSource.length;
    words.push(wordSource[index]);
  }
  return words;
};

const wordList = getWords(61); // Generate 100 random dictionary words

const fonts = [
  "Arial, sans-serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Times New Roman, serif",
  "Comic Sans MS, cursive",
  "Impact, sans-serif",
];

function App() {
  const [words, setWords] = useState<string[]>([]);

  const createItem = (word: string, index: number) : Bubble.Item => {
      const item = (
        <div key={index} 
            onClick={() => {
              setWords([...words, word])
            }}>
              {word}
        </div>
      );
      const style = {
        backgroundColor: `hsl(${index * 3}, 100%, 50%)`,
        color: `hsl(${(index * 3) + 180}, 100%, 50%)`,
        fontFamily: fonts[index % fonts.length],
      }
      return {item, style};
  }

  const content = wordList.map(createItem);

  const hexMap = HexMap.fromSpiral(Axial.ZERO, content);

  const rows = hexMap.toArray();


  return (
    <>
      <main>
       <div>
            {words.map((word, index) => (<span key={index}>{word} </span>))}
       </div>
       <Bubbles content={rows}/>
       </main>
    </>
  )
}

export default App
