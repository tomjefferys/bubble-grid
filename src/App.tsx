import { useMemo, useState } from 'react'
import './App.css'
import { BubbleGrid, Item } from './components/bubbleGrid'
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

  const createItem = (word: string, index: number) : Item => {
      const item = (
        <div key={index} 
            onClick={() => {
                setWords(prevWords => [...prevWords, word])
            }}>
              {word}
        </div>
      );
      const style = {
        border: "",
        backgroundColor: `hsl(${index * 3}, 100%, 50%)`,
        color: `hsl(${(index * 3) + 180}, 100%, 50%)`,
        fontFamily: fonts[index % fonts.length],
      }
      return {item, style};
  }

  const rows = useMemo(() => {
    const content = wordList.map(createItem);
    const hexMap = HexMap.fromSpiral(Axial.ZERO, content);
    return hexMap.toArray();
  }, []);

  return (
    <>
      <div style={{ height: "95%",
                    width: "100%",
                    boxSizing: "border-box",
                     }}>
       <div style={{ height: "30%", width: "100%" }}>
            {words.map((word, index) => (<span key={index}>{word} </span>))}
       </div>
       <div style={{ height: "30%", width: "75%", margin: "0 auto" }}>
          <BubbleGrid content={rows}/>
       </div>
       </div>
    </>
  )
}

export default App
